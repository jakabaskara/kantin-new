<?php

namespace App\Http\Requests\Cashier;

use App\Models\Transaction;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('transaction')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'integer',
                Rule::in([
                    Transaction::ORDER_STATUS_RECEIVED,
                    Transaction::ORDER_STATUS_PREPARING,
                    Transaction::ORDER_STATUS_READY,
                    Transaction::ORDER_STATUS_COMPLETED,
                    Transaction::ORDER_STATUS_CANCELLED,
                ]),
            ],
        ];
    }
}
