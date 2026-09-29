<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\Import;

/**
 * Import class kosong, hanya dipakai sebagai argumen wajib untuk
 * Excel::toArray(). Concerns\Import adalah interface penanda (marker)
 * tanpa method wajib.
 */
class StudentSheetReader implements Import
{
    //
}