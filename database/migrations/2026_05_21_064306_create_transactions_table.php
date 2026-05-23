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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name', 100);
            $table->decimal('total_amount', 18, 2);
            $table->string('payment_method', 20)->default('COD');
            $table->string('payment_status', 30)->default('paid');
            $table->unsignedTinyInteger('order_status')->default(1);
            $table->string('payment_proof_path')->nullable();
            $table->timestamps();

            $table->index(['outlet_id', 'order_status']);
            $table->index(['user_id', 'created_at']);
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
