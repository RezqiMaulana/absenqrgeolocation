<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    /**
     * List siswa. Mendukung search (?search=) dan filter kelas (?class_id=).
     */
    public function index(Request $request)
    {
        $query = Student::with(['schoolClass', 'user'])->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        if ($classId = $request->query('class_id')) {
            $query->where('class_id', $classId);
        }

        $students = $query->paginate($request->integer('per_page', 15));

        return response()->json($students);
    }

    public function show(Student $student)
    {
        return response()->json($student->load(['schoolClass', 'user']));
    }

    /**
     * Buat siswa baru + akun User (role: siswa) sekaligus.
     */
    public function store(StoreStudentRequest $request)
    {
        $data = $request->validated();

        $student = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? $data['nis']),
                'role' => 'siswa',
            ]);

            return Student::create([
                'user_id' => $user->id,
                'class_id' => $data['class_id'] ?? null,
                'nis' => $data['nis'],
                'name' => $data['name'],
                'gender' => $data['gender'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Siswa berhasil ditambahkan',
            'student' => $student->load(['schoolClass', 'user']),
        ], 201);
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $data = $request->validated();

        $student->update($data);

        // Sinkronkan nama di tabel users kalau nama siswa diubah
        if (isset($data['name']) && $student->user) {
            $student->user->update(['name' => $data['name']]);
        }

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui',
            'student' => $student->fresh(['schoolClass', 'user']),
        ]);
    }

    public function destroy(Student $student)
    {
        DB::transaction(function () use ($student) {
            $userId = $student->user_id;
            $student->delete();

            // Hapus juga akun user terkait supaya tidak jadi akun "yatim"
            if ($userId) {
                User::where('id', $userId)->delete();
            }
        });

        return response()->json([
            'message' => 'Siswa berhasil dihapus',
        ]);
    }
}
