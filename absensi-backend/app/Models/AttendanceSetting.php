<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $fillable = [
        'location_name',
        'latitude',
        'longitude',
        'radius_meters',
        'start_time',
        'end_time',
    ];

    /**
     * Ambil setting absensi yang aktif saat ini.
     * Untuk PHASE 1-2 kita asumsikan hanya ada 1 baris setting (single-row config).
     */
    public static function current(): self
    {
        return static::first();
    }
}
