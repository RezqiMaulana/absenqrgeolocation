<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tambahkan Foreign Key ke tabel classes
        Schema::table('classes', function (Blueprint $table) {
            $table->foreign('seksi_absensi_id')
                  ->references('id')
                  ->on('students')
                  ->onDelete('set null');
        });

        // Tambahkan Foreign Key ke tabel students
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('class_id')
                  ->references('id')
                  ->on('classes')
                  ->onDelete('cascade'); // atau 'set null' sesuai kebutuhan
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['seksi_absensi_id']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
        });
    }
};
