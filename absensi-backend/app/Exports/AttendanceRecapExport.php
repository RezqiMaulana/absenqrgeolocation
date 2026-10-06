<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AttendanceRecapExport implements FromArray, WithHeadings
{
    public function __construct(private array $rows)
    {
    }

    public function array(): array
    {
        return array_map(fn ($r) => [
            $r['nis'],
            $r['name'],
            $r['class'],
            $r['hadir'],
            $r['terlambat'],
            $r['alpa'],
            $r['persentase'].'%',
        ], $this->rows);
    }

    public function headings(): array
    {
        return ['NIS', 'Nama', 'Kelas', 'Hadir', 'Terlambat', 'Alpa', 'Persentase Kehadiran'];
    }
}
