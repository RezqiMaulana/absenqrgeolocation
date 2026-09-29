<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAttendanceSettingRequest;
use App\Models\AttendanceSetting;

class AttendanceSettingController extends Controller
{
    /**
     * Lihat pengaturan absensi yang aktif saat ini.
     * Bisa diakses semua role yang login (siswa perlu tahu radius & jam untuk validasi di frontend).
     */
    public function show()
    {
        $setting = AttendanceSetting::first();

        if (! $setting) {
            return response()->json([
                'message' => 'Pengaturan absensi belum dibuat. Hubungi Admin.',
            ], 404);
        }

        return response()->json($setting);
    }

    /**
     * Update pengaturan absensi. Hanya Admin (dibatasi di route).
     * Karena sistem hanya punya SATU baris setting (single-row config),
     * update akan membuat baris baru kalau belum ada, atau update baris pertama kalau sudah ada.
     */
    public function update(UpdateAttendanceSettingRequest $request)
    {
        $setting = AttendanceSetting::first();
        $data = $request->validated();

        if ($setting) {
            $setting->update($data);
        } else {
            $setting = AttendanceSetting::create($data);
        }

        return response()->json([
            'message' => 'Pengaturan absensi berhasil disimpan',
            'setting' => $setting->fresh(),
        ]);
    }
}
