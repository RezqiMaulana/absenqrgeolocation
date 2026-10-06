<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceRecapExport;
use App\Models\Attendance;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Susun data rekap kehadiran per siswa untuk satu rentang tanggal.
     *
     * CATATAN KETERBATASAN: "jumlah hari efektif sekolah" dihitung dari
     * jumlah TANGGAL BERBEDA yang punya minimal satu catatan absensi di
     * seluruh sistem pada rentang itu (bukan dari kalender akademik resmi,
     * karena sistem ini belum punya tabel kalender/hari libur). Jadi
     * persentase kehadiran di sini adalah PERKIRAAN, bukan angka resmi
     * dari kalender sekolah.
     */
    private function buildRecap(Request $request): array
    {
        $dateFrom = $request->query('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->query('date_to', now()->toDateString());
        $classId = $request->query('class_id');

        $studentsQuery = Student::with('schoolClass')->orderBy('name');
        if ($classId) {
            $studentsQuery->where('class_id', $classId);
        }
        $students = $studentsQuery->get();

        $effectiveDays = Attendance::whereBetween('date', [$dateFrom, $dateTo])
            ->distinct()
            ->count('date');
        $effectiveDays = max($effectiveDays, 1); // hindari pembagian dengan nol

        $attendances = Attendance::whereBetween('date', [$dateFrom, $dateTo])
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id');

        $rows = $students->map(function ($student) use ($attendances, $effectiveDays) {
            $studentAttendances = $attendances->get($student->id, collect());
            $hadir = $studentAttendances->where('status', 'hadir')->count();
            $terlambat = $studentAttendances->where('status', 'terlambat')->count();
            $alpa = max($effectiveDays - $hadir - $terlambat, 0);
            $persentase = round((($hadir + $terlambat) / $effectiveDays) * 100, 1);

            return [
                'nis' => $student->nis,
                'name' => $student->name,
                'class' => $student->schoolClass?->name ?? '-',
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'alpa' => $alpa,
                'persentase' => $persentase,
            ];
        })->values()->all();

        return [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'effective_days' => $effectiveDays,
            'rows' => $rows,
        ];
    }

    public function recap(Request $request)
    {
        return response()->json($this->buildRecap($request));
    }

    public function exportExcel(Request $request)
    {
        $data = $this->buildRecap($request);
        $filename = "rekap-presensi-{$data['date_from']}_sd_{$data['date_to']}.xlsx";

        return Excel::download(new AttendanceRecapExport($data['rows']), $filename);
    }

    public function exportPdf(Request $request)
    {
        $data = $this->buildRecap($request);
        $filename = "rekap-presensi-{$data['date_from']}_sd_{$data['date_to']}.pdf";

        $pdf = Pdf::loadView('reports.recap-pdf', $data);

        return $pdf->download($filename);
    }
}
