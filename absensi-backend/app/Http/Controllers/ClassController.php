<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = SchoolClass::with('waliKelas')
            ->withCount('students')
            ->orderBy('name');

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    public function show(SchoolClass $class)
    {
        return response()->json($class->load(['waliKelas', 'students']));
    }

    public function store(StoreClassRequest $request)
    {
        $class = SchoolClass::create($request->validated());

        return response()->json([
            'message' => 'Kelas berhasil ditambahkan',
            'class' => $class->load('waliKelas'),
        ], 201);
    }

    public function update(UpdateClassRequest $request, SchoolClass $class)
    {
        $class->update($request->validated());

        return response()->json([
            'message' => 'Kelas berhasil diperbarui',
            'class' => $class->fresh('waliKelas'),
        ]);
    }

    public function destroy(SchoolClass $class)
    {
        // Siswa di kelas ini otomatis class_id jadi null (lihat migration nullOnDelete),
        // bukan ikut terhapus.
        $class->delete();

        return response()->json([
            'message' => 'Kelas berhasil dihapus',
        ]);
    }
}
