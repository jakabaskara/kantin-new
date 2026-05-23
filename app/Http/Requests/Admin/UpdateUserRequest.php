<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('user')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isCashier = $this->input('role') === 'Cashier';
        $user = $this->route('user');

        return [
            'username' => [
                'required',
                'string',
                'max:100',
                Rule::unique('users', 'username')->ignore($user?->getKey()),
            ],
            'password' => ['nullable', 'string', 'max:100'],
            'role' => ['required', 'string', Rule::in(['Admin', 'Cashier', 'Customer'])],
            'fullName' => ['nullable', 'string', 'max:100'],
            'outletId' => [
                Rule::requiredIf($isCashier),
                'nullable',
                'integer',
                Rule::exists('outlets', 'id'),
            ],
        ];
    }
}
