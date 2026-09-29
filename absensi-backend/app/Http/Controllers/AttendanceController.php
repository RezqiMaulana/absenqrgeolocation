<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Support\QrTokenGenerator;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Ambil token QR untuk HARI INI. Ditampilkan Admin/Petugas sebagai QR code
     * di layar/proyektor. Frontend yang mengubah string token ini jadi gambar QR
     * (pakai library QR generator di React), backend hanya menyediakan string-nya.
     */
    public function qrToken()
    {
        return response()->json([
            'qr_token' => QrTokenGenerator::generate(),
            'valid_date' => now()->toDateString(),
        ]);
    }

    /**
     * Proses absensi siswa.
     *
     * Flow: Validasi QR -> Ambil setting lokasi -> Hitung jarak (Haversine)
     *       -> Validasi radius -> Validasi jam -> Cek duplikat -> Simpan.
     *
     * PENTING: latitude/longitude dari frontend TIDAK PERNAH dipercaya begitu saja.
     * Semua keputusan valid/tidak valid dihitung ulang di sini, di server.
     */
    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        // ---- 1. Validasi QR ----
        if (! QrTokenGenerator::isValid($data['qr_token'])) {
            return response()->json([
                'message' => 'QR Code tidak valid atau sudah kadaluarsa. Silakan scan ulang.',
            ], 422);
        }

        $student = $request->user()->student;

        if (! $student) {
            return response()->json([
                'message' => 'Akun ini tidak terhubung ke data siswa manapun.',
            ], 422);
        }

        // ---- 2. Cek duplikat: sudah absen hari ini? ----
        $today = now()->toDateString();
        $alreadyAttended = Attendance::where('student_id', $student->id)
            ->whereDate('date', $today)
            ->exists();

        if ($alreadyAttended) {
            return response()->json([
                'message' => 'Kamu sudah melakukan absensi hari ini.',
            ], 422);
        }

        // ---- 3. Ambil pengaturan lokasi & waktu ----
        $setting = AttendanceSetting::first();

        if (! $setting) {
            return response()->json([
                'message' => 'Pengaturan absensi belum diatur oleh Admin.',
            ], 422);
        }

        // ---- 4. Hitung jarak pakai rumus Haversine ----
        $distanceMeters = $this->calculateDistanceMeters(
            (float) $data['latitude'],
            (float) $data['longitude'],
            (float) $setting->latitude,
            (float) $setting->longitude,
        );

        // ---- 5. Validasi radius ----
        if ($distanceMeters > $setting->radius_meters) {
            return response()->json([
                'message' => 'Kamu berada di luar radius area absensi.',
                'location' => [
                    'location_name' => $setting->location_name,
                    'distance_meters' => round($distanceMeters, 2),
                    'radius_meters' => $setting->radius_meters,
                    'status' => 'ditolak',
                ],
            ], 422);
        }

        // ---- 6. Validasi & tentukan status waktu ----
        $now = now();
        $startTime = $now->copy()->setTimeFromTimeString($setting->start_time);
        $endTime = $now->copy()->setTimeFromTimeString($setting->end_time);
        // Toleransi terlambat: 15 menit setelah jam mulai masih dianggap "hadir",
        // setelah itu sampai jam selesai dianggap "terlambat".
        $lateThreshold = $startTime->copy()->addMinutes(15);

        if ($now->lt($startTime)) {
            return response()->json([
                'message' => 'Belum waktunya absensi. Absensi dibuka mulai jam '.$setting->start_time.'.',
            ], 422);
        }

        if ($now->gt($endTime)) {
            return response()->json([
                'message' => 'Waktu absensi sudah berakhir (batas jam '.$setting->end_time.').',
            ], 422);
        }

        $status = $now->lte($lateThreshold) ? 'hadir' : 'terlambat';

        // ---- 7. Simpan absensi ----
        $attendance = Attendance::create([
            'student_id' => $student->id,
            'date' => $today,
            'time' => $now->format('H:i:s'),
            'status' => $status,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'distance_meters' => $distanceMeters,
        ]);

        return response()->json([
            'message' => $status === 'hadir'
                ? 'Absensi berhasil, kamu tercatat HADIR.'
                : 'Absensi berhasil, kamu tercatat TERLAMBAT.',
            'attendance' => $attendance,
            'location' => [
                'location_name' => $setting->location_name,
                'distance_meters' => round($distanceMeters, 2),
                'radius_meters' => $setting->radius_meters,
                'status' => $status,
            ],
        ], 201);
    }

    /**
     * Riwayat absensi milik siswa yang sedang login.
     * Filter opsional: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
     */
    public function myAttendance(Request $request)
    {
        $student = $request->user()->student;

        if (! $student) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke data siswa.'], 422);
        }

        $query = Attendance::where('student_id', $student->id)->orderByDesc('date');

        $this->applyDateRangeFilter($query, $request);

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Absensi untuk kelas yang diampu Wali Kelas yang sedang login.
     */
    public function myClassAttendance(Request $request)
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke data guru.'], 422);
        }

        $classIds = $teacher->classesAsWali()->pluck('id');

        if ($classIds->isEmpty()) {
            return response()->json(['message' => 'Kamu belum menjadi wali kelas manapun.'], 422);
        }

        $query = Attendance::with(['student.schoolClass'])
            ->whereHas('student', fn ($q) => $q->whereIn('class_id', $classIds))
            ->orderByDesc('date');

        $this->applyDateRangeFilter($query, $request);
        $this->applySearchAndStatusFilter($query, $request);

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Semua absensi (Admin & Seksi Absensi). Mendukung search, filter kelas,
     * filter status, dan date range.
     */
    public function index(Request $request)
    {
        $query = Attendance::with(['student.schoolClass'])->orderByDesc('date');

        if ($classId = $request->query('class_id')) {
            $query->whereHas('student', fn ($q) => $q->where('class_id', $classId));
        }

        $this->applyDateRangeFilter($query, $request);
        $this->applySearchAndStatusFilter($query, $request);

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Detail satu absensi, dengan otorisasi ketat sesuai role:
     * - admin, seksi_absensi: bebas lihat semua
     * - wali_kelas: hanya kalau siswa itu ada di kelas yang dia ampu
     * - siswa: hanya kalau itu absensinya sendiri
     */
    public function show(Request $request, Attendance $attendance)
    {
        $user = $request->user();
        $attendance->load(['student.schoolClass']);

        $allowed = match ($user->role) {
            'admin', 'seksi_absensi' => true,
            'wali_kelas' => $user->teacher
                && $attendance->student->class_id
                && $user->teacher->classesAsWali()->where('id', $attendance->student->class_id)->exists(),
            'siswa' => $user->student && $attendance->student_id === $user->student->id,
            default => false,
        };

        if (! $allowed) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke absensi ini.'], 403);
        }

        return response()->json($attendance);
    }

    private function applyDateRangeFilter($query, Request $request): void
    {
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }
    }

    private function applySearchAndStatusFilter($query, Request $request): void
    {
        if ($search = $request->query('search')) {
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
    }

    /**
     * Rumus Haversine: menghitung jarak antara 2 titik koordinat (dalam meter).
     */
    private function calculateDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusMeters = 6371000;

        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLon = deg2rad($lon2 - $lon1);

        $a = sin($deltaLat / 2) ** 2
            + cos($lat1Rad) * cos($lat2Rad) * sin($deltaLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusMeters * $c;
    }
}
