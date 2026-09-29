<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classId = $this->route('class')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100', 'unique:classes,name,'.$classId],
            'wali_kelas_id' => ['nullable', 'exists:teachers,id'],
            'seksi_absensi_id' => ['nullable', 'exists:students,id'],
        ];
    }
}
