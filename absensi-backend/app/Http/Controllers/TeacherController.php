<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::with('user')->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    public function show(Teacher $teacher)
    {
        return response()->json($teacher->load(['user', 'classesAsWali']));
    }

    /**
     * Buat guru baru + akun User (role: wali_kelas atau seksi_absensi) sekaligus.
     */
    public function store(StoreTeacherRequest $request)
    {
        $data = $request->validated();

        $teacher = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? $data['nip']),
                'role' => $data['role'],
            ]);

            return Teacher::create([
                'user_id' => $user->id,
                'nip' => $data['nip'],
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Guru berhasil ditambahkan',
            'teacher' => $teacher->load('user'),
        ], 201);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher)
    {
        $data = $request->validated();

        $teacher->update($data);

        if (isset($data['name']) && $teacher->user) {
            $teacher->user->update(['name' => $data['name']]);
        }

        return response()->json([
            'message' => 'Data guru berhasil diperbarui',
            'teacher' => $teacher->fresh('user'),
        ]);
    }

    public function destroy(Teacher $teacher)
    {
        DB::transaction(function () use ($teacher) {
            $userId = $teacher->user_id;
            $teacher->delete();

            if ($userId) {
                User::where('id', $userId)->delete();
            }
        });

        return response()->json([
            'message' => 'Guru berhasil dihapus',
        ]);
    }
}
