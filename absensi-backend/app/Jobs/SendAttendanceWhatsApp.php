<?php

namespace App\Jobs;

use App\Models\Attendance;
use App\Services\FonnteService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendAttendanceWhatsApp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan ulang jika request ke Fonnte gagal.
     */
    public int $tries = 3;

    /**
     * Tunggu 10 detik sebelum retry.
     */
    public int $backoff = 10;

    public function __construct(
        protected Attendance $attendance,
        protected string $status,
    ) {}

    public function handle(FonnteService $fonnte): void
    {
        // Load relasi student beserta kelas
        $this->attendance->load(['student.schoolClass']);
        $student = $this->attendance->student;

        if (! $student) {
            return;
        }

        $statusLabel = match ($this->status) {
            'hadir'     => '✅ HADIR',
            'terlambat' => '⚠️ TERLAMBAT',
            'izin'      => '📋 IZIN',
            'sakit'     => '🏥 SAKIT',
            default     => strtoupper($this->status),
        };

        $className = $student->schoolClass?->name ?? '-';
        $date      = Carbon::parse($this->attendance->date)
                        ->locale('id')
                        ->isoFormat('dddd, D MMMM YYYY');
        $time      = substr($this->attendance->time, 0, 5); // HH:MM

        // -------------------------------------------------------
        // Pesan untuk ORANG TUA / WALI
        // -------------------------------------------------------
        $messageToParent =
            "📚 *Notifikasi Absensi Sekolah*\n\n"
            . "Yth. Orang Tua/Wali dari *{$student->name}*\n\n"
            . "Kami informasikan bahwa putra/putri Bapak/Ibu telah melakukan absensi:\n\n"
            . "📅 Tanggal : {$date}\n"
            . "⏰ Jam     : {$time}\n"
            . "🏫 Kelas   : {$className}\n"
            . "📌 Status  : {$statusLabel}\n\n"
            . "_Pesan ini dikirim otomatis oleh Sistem Absensi Sekolah._";

        // -------------------------------------------------------
        // Pesan untuk SISWA
        // -------------------------------------------------------
        $messageToStudent =
            "📚 *Absensi Berhasil Dicatat!*\n\n"
            . "Halo *{$student->name}*,\n\n"
            . "Absensimu telah dicatat dengan status *{$statusLabel}*.\n\n"
            . "📅 Tanggal : {$date}\n"
            . "⏰ Jam     : {$time}\n"
            . "🏫 Kelas   : {$className}\n\n"
            . "_Sistem Absensi Sekolah_";

        // -------------------------------------------------------
        // Kirim notifikasi
        // -------------------------------------------------------
        if (! empty($student->parent_phone)) {
            $fonnte->send($student->parent_phone, $messageToParent);
        }

        if (! empty($student->student_phone)) {
            $fonnte->send($student->student_phone, $messageToStudent);
        }
    }
}
