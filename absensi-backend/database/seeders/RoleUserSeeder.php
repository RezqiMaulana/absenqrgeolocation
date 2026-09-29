<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleUserSeeder extends Seeder
{
    /**
     * Buat 1 akun testing untuk setiap role.
     * Password semua akun: password123
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin Piket', 'email' => 'admin@sekolah.test', 'role' => 'admin'],
            ['name' => 'Wali Kelas Testing', 'email' => 'walikelas@sekolah.test', 'role' => 'wali_kelas'],
            ['name' => 'Seksi Absensi Testing', 'email' => 'seksiabsensi@sekolah.test', 'role' => 'seksi_absensi'],
            ['name' => 'Siswa Testing', 'email' => 'siswa@sekolah.test', 'role' => 'siswa'],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password123'),
                    'role' => $account['role'],
                ]
            );
        }
    }
}
