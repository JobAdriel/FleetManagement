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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('plate')->unique();
            $table->string('vin')->unique();
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->integer('odometer')->default(0);
            $table->string('fuel_type')->nullable();
            $table->string('status')->default('active');
            $table->uuid('assigned_driver_id')->nullable();
            $table->string('cost_center')->nullable();
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('assigned_driver_id')->references('id')->on('drivers')->onDelete('set null');
            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
