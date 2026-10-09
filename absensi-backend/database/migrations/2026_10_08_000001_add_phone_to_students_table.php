<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Nomor HP orang tua/wali (format: 628xxxxx)
            $table->string('parent_phone', 20)->nullable()->after('gender');
            // Nomor HP siswa sendiri (opsional)
            $table->string('student_phone', 20)->nullable()->after('parent_phone');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['parent_phone', 'student_phone']);
        });
    }
};
