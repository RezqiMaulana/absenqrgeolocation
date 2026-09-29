<?php

namespace App\Http\Controllers;

use App\Imports\StudentSheetReader;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;

class StudentImportController extends Controller
{
    /**
     * Kolom wajib ada di baris header Excel (huruf kecil semua, tanpa spasi ekstra).
     */
    private const REQUIRED_COLUMNS = ['nis', 'name', 'email', 'class_name'];

    /**
     * Import data siswa dari Excel.
     *
     * Mode preview (?preview=1): validasi saja, TIDAK menyimpan apapun ke database.
     * Mode import (default): baris yang valid langsung disimpan.
     *
     * Flow: Upload -> Validate file -> Read Excel -> Validate columns
     *       -> Validate data -> Detect duplicate -> (Preview | Import) -> Summary
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'], // max 5MB
        ]);

        $isPreview = $request->boolean('preview', false);

        $sheets = Excel::toArray(new StudentSheetReader(), $request->file('file'));
        $rows = $sheets[0] ?? [];

        if (count($rows) < 2) {
            return response()->json([
                'message' => 'File Excel kosong atau tidak ada baris data.',
            ], 422);
        }

        // ---- Validasi kolom header ----
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $rows[0]);
        $missingColumns = array_values(array_diff(self::REQUIRED_COLUMNS, $header));

        if (! empty($missingColumns)) {
            return response()->json([
                'message' => 'Kolom Excel tidak lengkap.',
                'missing_columns' => $missingColumns,
                'expected_columns' => self::REQUIRED_COLUMNS,
            ], 422);
        }

        $dataRows = array_slice($rows, 1);

        $summary = ['total' => 0, 'berhasil' => 0, 'gagal' => 0, 'duplikat' => 0];
        $results = [];
        $seenNisInFile = [];
        $seenEmailInFile = [];

        foreach ($dataRows as $index => $row) {
            $rowNumber = $index + 2; // +2 karena baris 1 = header, index mulai dari 0

            // Lewati baris yang benar-benar kosong
            if (empty(array_filter($row, fn ($v) => trim((string) $v) !== ''))) {
                continue;
            }

            $summary['total']++;

            $data = array_combine($header, array_pad($row, count($header), null));
            $nis = trim((string) ($data['nis'] ?? ''));
            $name = trim((string) ($data['name'] ?? ''));
            $email = trim((string) ($data['email'] ?? ''));
            $gender = strtoupper(trim((string) ($data['gender'] ?? '')));
            $className = trim((string) ($data['class_name'] ?? ''));

            $errors = [];
            $isDuplicate = false;

            if ($nis === '') {
                $errors[] = 'NIS kosong';
            }
            if ($name === '') {
                $errors[] = 'Nama kosong';
            }
            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Email kosong atau tidak valid';
            }
            if ($gender !== '' && ! in_array($gender, ['L', 'P'], true)) {
                $errors[] = "Gender harus 'L' atau 'P'";
            }

            // ---- Deteksi duplikat: dalam file & di database ----
            if ($nis !== '') {
                if (isset($seenNisInFile[$nis])) {
                    $errors[] = 'NIS duplikat di dalam file (baris '.$seenNisInFile[$nis].')';
                    $isDuplicate = true;
                } elseif (Student::where('nis', $nis)->exists()) {
                    $errors[] = 'NIS sudah terdaftar di database';
                    $isDuplicate = true;
                }
            }
            if ($email !== '') {
                if (isset($seenEmailInFile[$email])) {
                    $errors[] = 'Email duplikat di dalam file (baris '.$seenEmailInFile[$email].')';
                    $isDuplicate = true;
                } elseif (User::where('email', $email)->exists()) {
                    $errors[] = 'Email sudah terdaftar di database';
                    $isDuplicate = true;
                }
            }

            $classId = null;
            if ($className !== '') {
                $class = SchoolClass::where('name', $className)->first();
                if (! $class) {
                    $errors[] = "Kelas '{$className}' tidak ditemukan";
                } else {
                    $classId = $class->id;
                }
            }

            if (! empty($errors)) {
                $summary['gagal']++;
                if ($isDuplicate) {
                    $summary['duplikat']++;
                }

                $results[] = [
                    'row' => $rowNumber,
                    'nis' => $nis,
                    'name' => $name,
                    'status' => $isDuplicate ? 'duplikat' : 'gagal',
                    'errors' => $errors,
                ];

                continue;
            }

            // Baris valid: tandai supaya baris berikutnya di file yang sama
            // terdeteksi sebagai duplikat kalau ada NIS/email yang sama lagi.
            $seenNisInFile[$nis] = $rowNumber;
            $seenEmailInFile[$email] = $rowNumber;

            if (! $isPreview) {
                DB::transaction(function () use ($nis, $name, $email, $gender, $classId) {
                    $user = User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make($nis), // password default = NIS
                        'role' => 'siswa',
                    ]);

                    Student::create([
                        'user_id' => $user->id,
                        'class_id' => $classId,
                        'nis' => $nis,
                        'name' => $name,
                        'gender' => $gender ?: null,
                    ]);
                });
            }

            $summary['berhasil']++;
            $results[] = [
                'row' => $rowNumber,
                'nis' => $nis,
                'name' => $name,
                'status' => 'valid',
                'errors' => [],
            ];
        }

        return response()->json([
            'mode' => $isPreview ? 'preview' : 'import',
            'summary' => $summary,
            'rows' => $results,
        ]);
    }
}
