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
        Schema::table('quotes', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['rfq_id']);
            
            // Make rfq_id nullable
            $table->uuid('rfq_id')->nullable()->change();
            
            // Re-add foreign key with cascade delete
            $table->foreign('rfq_id')->references('id')->on('rfqs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            // Drop foreign key
            $table->dropForeign(['rfq_id']);
            
            // Make rfq_id NOT NULL again
            $table->uuid('rfq_id')->nullable(false)->change();
            
            // Re-add foreign key
            $table->foreign('rfq_id')->references('id')->on('rfqs')->onDelete('cascade');
        });
    }
};
