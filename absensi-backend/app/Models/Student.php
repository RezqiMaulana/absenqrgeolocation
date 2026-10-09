<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'class_id',
        'nis',
        'name',
        'gender',
        'parent_phone',  // Nomor HP orang tua/wali (format: 628xxxxxxx)
        'student_phone', // Nomor HP siswa (opsional)
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Kelas di mana siswa ini ditunjuk sebagai Seksi Absensi (kalau ada).
     * Satu siswa maksimal jadi seksi absensi untuk satu kelas.
     */
    public function classAsSeksiAbsensi()
    {
        return $this->hasOne(SchoolClass::class, 'seksi_absensi_id');
    }
}
