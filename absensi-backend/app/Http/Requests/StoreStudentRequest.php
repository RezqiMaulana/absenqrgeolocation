<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // otorisasi role sudah ditangani middleware di route
    }

    public function rules(): array
    {
        return [
            'nis'          => ['required', 'string', 'max:30', 'unique:students,nis'],
            'name'         => ['required', 'string', 'max:255'],
            'gender'       => ['nullable', 'in:L,P'],
            'class_id'     => ['nullable', 'exists:classes,id'],
            'email'        => ['required', 'email', 'unique:users,email'],
            'password'     => ['nullable', 'string', 'min:6'],
            'parent_phone' => ['nullable', 'string', 'max:20', 'regex:/^62[0-9]{8,13}$/'],
            'student_phone'=> ['nullable', 'string', 'max:20', 'regex:/^62[0-9]{8,13}$/'],
        ];
    }
}
