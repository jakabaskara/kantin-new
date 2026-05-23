<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'fullName' => $this->full_name,
            'role' => $this->role,
            'outletId' => $this->outlet_id,
            'outletName' => $this->when(
                $this->relationLoaded('outlet'),
                fn () => $this->outlet?->name,
                null,
            ),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
