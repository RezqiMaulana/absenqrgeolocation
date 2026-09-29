<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = [
        'user_id',
        'nip',
        'name',
        'phone',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Kelas-kelas di mana guru ini menjadi wali kelas
    public function classesAsWali()
    {
        return $this->hasMany(SchoolClass::class, 'wali_kelas_id');
    }
}
