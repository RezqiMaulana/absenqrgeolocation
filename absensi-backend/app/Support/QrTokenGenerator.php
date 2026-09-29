<?php

namespace App\Support;

/**
 * QR Code untuk absensi TIDAK menyimpan identitas siswa sama sekali.
 * Token dihasilkan dari kombinasi tanggal hari ini + APP_KEY, jadi:
 * - Otomatis berbeda tiap hari (token kemarin tidak bisa dipakai lagi hari ini).
 * - Tidak perlu disimpan di database sama sekali (dihitung ulang saat divalidasi).
 * - Tidak bisa ditebak orang lain tanpa tahu APP_KEY aplikasi.
 */
class QrTokenGenerator
{
    /**
     * Buat token untuk tanggal tertentu (default: hari ini).
     */
    public static function generate(?string $date = null): string
    {
        $date ??= now()->toDateString();

        return hash_hmac('sha256', $date, config('app.key'));
    }

    /**
     * Cek apakah token yang dikirim siswa (hasil scan QR) valid untuk HARI INI.
     */
    public static function isValid(string $token): bool
    {
        return hash_equals(self::generate(), $token);
    }
}
