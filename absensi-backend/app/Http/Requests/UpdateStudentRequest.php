<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $studentId = $this->route('student')?->id;

        return [
            'nis' => ['sometimes', 'required', 'string', 'max:30', 'unique:students,nis,'.$studentId],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'gender' => ['nullable', 'in:L,P'],
            'class_id' => ['nullable', 'exists:classes,id'],
        ];
    }
}
