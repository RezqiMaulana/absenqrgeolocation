<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk tabel `classes`.
 * Nama class dibuat "SchoolClass" karena `Class` adalah reserved word di PHP.
 */
class SchoolClass extends Model
{
    protected $table = 'classes';

    protected $fillable = [
        'name',
        'wali_kelas_id',
        'seksi_absensi_id',
    ];

    public function waliKelas()
    {
        return $this->belongsTo(Teacher::class, 'wali_kelas_id');
    }

    /**
     * Seksi Absensi = SISWA (bukan guru) yang ditunjuk dari kelas ini sendiri
     * untuk membantu memantau absensi kelasnya.
     */
    public function seksiAbsensi()
    {
        return $this->belongsTo(Student::class, 'seksi_absensi_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
