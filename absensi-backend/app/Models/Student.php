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
