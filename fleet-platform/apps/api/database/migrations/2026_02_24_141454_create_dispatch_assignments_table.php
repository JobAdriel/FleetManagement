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
        Schema::create('dispatch_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('dispatch_request_id');
            $table->uuid('vehicle_id');
            $table->uuid('driver_id');
            $table->dateTime('planned_departure')->nullable();
            $table->dateTime('planned_arrival')->nullable();
            $table->dateTime('actual_departure')->nullable();
            $table->dateTime('actual_arrival')->nullable();
            $table->integer('odometer_start')->nullable();
            $table->integer('odometer_end')->nullable();
            $table->decimal('fuel_start', 5, 2)->nullable();
            $table->decimal('fuel_end', 5, 2)->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('dispatch_request_id')->references('id')->on('dispatch_requests')->onDelete('cascade');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('driver_id')->references('id')->on('drivers')->onDelete('cascade');
            $table->index('tenant_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispatch_assignments');
    }
};
