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
        Schema::create('quote_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quote_id');
            $table->string('description');
            $table->string('item_type');
            $table->integer('quantity')->default(1);
            $table->string('unit');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('tax', 12, 2)->default(0);
            $table->timestamps();
            $table->foreign('quote_id')->references('id')->on('quotes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_items');
    }
};
