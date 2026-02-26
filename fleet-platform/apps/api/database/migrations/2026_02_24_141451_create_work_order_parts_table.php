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
        Schema::create('work_order_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('work_order_id');
            $table->string('name');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_cost', 12, 2);
            $table->timestamps();
            $table->foreign('work_order_id')->references('id')->on('work_orders')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_order_parts');
    }
};
