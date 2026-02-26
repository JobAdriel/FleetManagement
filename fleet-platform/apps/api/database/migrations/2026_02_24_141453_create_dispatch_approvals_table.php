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
        Schema::create('dispatch_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('dispatch_request_id');
            $table->uuid('approver_id');
            $table->string('decision')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->foreign('dispatch_request_id')->references('id')->on('dispatch_requests')->onDelete('cascade');
            $table->foreign('approver_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispatch_approvals');
    }
};
