<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // contoh: XII RPL 1
            $table->foreignId('wali_kelas_id')->nullable();
            $table->foreignId('seksi_absensi_id')
                ->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('seksi_absensi_id');
        });
    }
};
