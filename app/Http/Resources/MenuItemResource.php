<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'outletId' => $this->outlet_id,
            'outletName' => $this->when(
                $this->relationLoaded('outlet'),
                fn () => $this->outlet?->name,
                null,
            ),
            'stockQuantity' => $this->when(
                $this->relationLoaded('stock'),
                fn () => $this->stock?->quantity ?? 0,
                0,
            ),
            'imageUrl' => $this->image_url,
        ];
    }
}
