<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceSettingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentImportController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

// ============================================
// PUBLIC ROUTES
// ============================================
Route::post('/login', [AuthController::class, 'login']);

// ============================================
// AUTHENTICATED ROUTES (semua role, wajib login)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ----------------------------------------
    // ATTENDANCE SETTINGS
    // ----------------------------------------
    Route::get('/attendance-settings', [AttendanceSettingController::class, 'show']);
    Route::middleware('role:admin')->put('/attendance-settings', [AttendanceSettingController::class, 'update']);

    // ----------------------------------------
    // QR ATTENDANCE
    // ----------------------------------------
    Route::middleware('role:admin')->get('/qr/token', [AttendanceController::class, 'qrToken']);
    Route::middleware('role:siswa')->post('/attendance', [AttendanceController::class, 'store']);
    Route::middleware('role:siswa')->get('/attendance/me', [AttendanceController::class, 'myAttendance']);
    Route::middleware('role:wali_kelas')->get('/attendance/my-class', [AttendanceController::class, 'myClassAttendance']);
    Route::middleware('role:admin,seksi_absensi')->get('/attendance', [AttendanceController::class, 'index']);
    Route::middleware('role:admin,seksi_absensi,wali_kelas,siswa')->get('/attendance/{attendance}', [AttendanceController::class, 'show']);

    // ----------------------------------------
    // MASTER DATA — hanya Admin
    // ----------------------------------------
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('students', StudentController::class);
        Route::post('/students/import', [StudentImportController::class, 'import']);
        Route::apiResource('teachers', TeacherController::class);
        Route::apiResource('classes', ClassController::class)->parameters([
            'classes' => 'class',
        ]);
    });

    // ----------------------------------------
    // PHASE 6+ akan ditambahkan di sini:
    // Route::middleware('role:admin')->post('/students/import', ...);
    // Route::middleware('role:admin,wali_kelas,seksi_absensi')->group(function () { ... monitoring ... });
    // Route::middleware('role:siswa')->group(function () { ... scan QR, absensi ... });
    // ----------------------------------------
});
