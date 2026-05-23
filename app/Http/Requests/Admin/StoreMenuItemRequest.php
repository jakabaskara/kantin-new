<?php

namespace App\Http\Requests\Admin;

use App\Models\MenuItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', MenuItem::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $outletRules = $this->input('outletId') === 'all'
            ? ['required', 'string', Rule::in(['all'])]
            : ['required', 'integer', Rule::exists('outlets', 'id')];

        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0', 'max:100000'],
            'outletId' => $outletRules,
            'initialStockQuantity' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'imageFile' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif', 'max:10240'],
        ];
    }
}
