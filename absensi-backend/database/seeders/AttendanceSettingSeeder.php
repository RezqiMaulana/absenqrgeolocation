<?php

namespace Database\Seeders;

use App\Models\AttendanceSetting;
use Illuminate\Database\Seeder;

class AttendanceSettingSeeder extends Seeder
{
    /**
     * Buat 1 baris pengaturan default kalau belum ada.
     * Koordinat contoh: Monas, Jakarta (GANTI dengan koordinat sekolah kamu yang sebenarnya).
     */
    public function run(): void
    {
        AttendanceSetting::firstOrCreate(
            [], // single-row config, kondisi kosong = ambil/cek baris pertama
            [
                'location_name' => 'Kampus Belakang SMKN 1 Sumedang',
                'latitude' => -6.836329,
                'longitude' => 107.927029,
                'radius_meters' => 100,
                'start_time' => '06:30:00',
                'end_time' => '08:00:00',
            ]
        );
    }
}
