<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Models\Student;
use App\Support\QrTokenGenerator;
use Illuminate\Http\Request;
use Carbon\Carbon;

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

        if ($now->lt($startTime)) {
            return response()->json([
                'message' => 'Belum waktunya absensi. Absensi dibuka mulai jam '.$setting->start_time.'.',
            ], 422);
        }

        // Tentukan status berdasarkan end_time:
        // - Jika waktu sekarang <= end_time, statusnya 'hadir'
        // - Jika waktu sekarang > end_time, statusnya otomatis 'terlambat' (tetap diizinkan absen)
        $status = $now->lte($endTime) ? 'hadir' : 'terlambat';  

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

    public function classDailyMonitoring(Request $request)
    {
    $user = $request->user();
    
    if ($user->role !== 'wali_kelas') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $date = $request->get('date', now()->format('Y-m-d'));
    $search = $request->get('search');
    $statusFilter = $request->get('status');

    // PERIKSA NAMA KOLOM INI: Ubah 'class_id' menjadi 'school_class_id' jika struktur database Anda menggunakan itu
    $query = Student::where('class_id', $user->class_id); 
    // Contoh jika menggunakan school_class_id:
    // $query = Student::where('school_class_id', $user->class_id);

    if ($search) {
        $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('nis', 'like', "%{$search}%");
        });
    }

    $students = $query->paginate(15);

    $students->getCollection()->transform(function ($student) use ($date, $statusFilter) {
        $attendance = Attendance::where('student_id', $student->id)
            ->whereDate('date', $date)
            ->first();

        return [
            'student_id' => $student->id,
            'nis' => $student->nis,
            'name' => $student->name,
            'time' => $attendance ? $attendance->time : null,
            'distance_meters' => $attendance ? $attendance->distance_meters : null,
            'status' => $attendance ? $attendance->status : 'alpa',
        ];
    });

    if ($statusFilter) {
        $filteredCollection = $students->getCollection()->filter(function ($item) use ($statusFilter) {
            return $item['status'] === $statusFilter;
        });
        $students->setCollection($filteredCollection);
    }

    return response()->json($students);
    }

    public function storePermission(Request $request)
    {
    $user = $request->user();

    // Validasi ketat: Hanya izinkan jika rolenya wali_kelas atau seksi_absensi (dan admin jika diperlukan)
    if (!in_array($user->role, ['wali_kelas', 'seksi_absensi', 'admin'])) {
        return response()->json([
            'message' => 'Akses ditolak. Hanya Wali Kelas dan Seksi Absensi yang dapat menginput izin atau sakit.'
        ], 403);
    }

    $request->validate([
        'student_id' => 'required|exists:students,id',
        'status'     => 'required|in:izin,sakit',
        'date'       => 'required|date',
        'note'       => 'nullable|string|max:255', 
    ]);

    // Jika yang login adalah Wali Kelas, kita bisa batasi agar dia hanya bisa menginput 
    // siswa yang berada di kelas binaannya (opsional tapi sangat direkomendasikan)
    $student = Student::findOrFail($request->student_id);
    if ($user->role === 'wali_kelas' && $user->class_id !== $student->class_id) {
        return response()->json([
            'message' => 'Anda hanya dapat menginput izin/sakit untuk siswa di kelas Anda.'
        ], 403);
    }

    // Proses simpan atau update data absensi
    $existingAttendance = Attendance::where('student_id', $request->student_id)
        ->whereDate('date', $request->date)
        ->first();

    if ($existingAttendance) {
        $existingAttendance->update([
            'status' => $request->status,
            'time'   => now()->format('H:i:s'),
        ]);
    } else {
        Attendance::create([
            'student_id' => $request->student_id,
            'date'       => $request->date,
            'time'       => now()->format('H:i:s'),
            'status'     => $request->status, 
            'latitude'   => null,
            'longitude'  => null,
            'distance_meters' => null,
        ]);
    }

    return response()->json([
        'message' => 'Status izin/sakit siswa berhasil dicatat.',
    ], 200);
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
     * Absensi untuk kelas di mana siswa yang sedang login ditunjuk sebagai
     * Seksi Absensi (siswa yang membantu memantau absensi kelasnya sendiri).
     */
    public function mySeksiClassAttendance(Request $request)
    {
        $student = $request->user()->student;

        if (! $student) {
            return response()->json(['message' => 'Akun ini tidak terhubung ke data siswa.'], 422);
        }

        $class = $student->classAsSeksiAbsensi;

        if (! $class) {
            return response()->json(['message' => 'Kamu bukan Seksi Absensi kelas manapun.'], 422);
        }

        $query = Attendance::with(['student.schoolClass'])
            ->whereHas('student', fn ($q) => $q->where('class_id', $class->id))
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
            'siswa' => $user->student && (
                $attendance->student_id === $user->student->id
                || ($user->student->classAsSeksiAbsensi && $user->student->classAsSeksiAbsensi->id === $attendance->student->class_id)
            ),
            default => false,
        };

        if (! $allowed) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke absensi ini.'], 403);
        }

        return response()->json($attendance);
    }

    public function weeklyStats(Request $request)
    {
    $type = $request->get('this_week', true); // true untuk pekan ini, false untuk pekan lalu
    
    // Tentukan awal minggu (Senin) dan akhir minggu (Jumat/Minggu)
    $startDate = now();
    if (!$type) {
        $startDate->subWeek();
    }
    
    // Pastikan mengambil dari Senin minggu tersebut
    $startOfWeek = $startDate->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
    $endOfWeek = $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
    
    $totalStudents = Student::count(); // Total seluruh siswa terdaftar (misal: 66)
    if ($totalStudents === 0) $totalStudents = 1; // Mencegah division by zero

    $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    $result = [];

    // Loop dari Senin sampai Jumat
    $currentDayWalker = $startOfWeek->copy();
    for ($i = 0; $i < 5; $i++) {
        $dateStr = $currentDayWalker->format('Y-m-d');
        $dayName = $days[$i];

        // Ambil data absensi berdasarkan tanggal spesifik hari tersebut
        $attendances = Attendance::whereDate('date', $dateStr)->get();

        $hadir = $attendances->where('status', 'hadir')->count();
        $terlambat = $attendances->where('status', 'terlambat')->count();
        $izinSakit = $attendances->whereIn('status', ['izin', 'sakit'])->count();
        
        // Hitung alpa (sisa siswa yang tidak ada catatan hadir, terlambat, maupun izin/sakit)
        $totalMasuk = $hadir + $terlambat + $izinSakit;
        $alpa = max(0, $totalStudents - $totalMasuk);

        // Jika ingin bentuk persentase (%) untuk grafik:
        $result[] = [
            'hari' => $dayName,
            'hadir' => (float) number_format(($hadir / $totalStudents) * 100, 1),
            'terlambat' => (float) number_format(($terlambat / $totalStudents) * 100, 1),
            'izin_sakit' => (float) number_format(($izinSakit / $totalStudents) * 100, 1),
            'alpa' => (float) number_format(($alpa / $totalStudents) * 100, 1),
        ];

        $currentDayWalker->addDay();
    }

    return response()->json(['data' => $result]);
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
