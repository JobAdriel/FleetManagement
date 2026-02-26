<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // password_reset_tokens already created by default Laravel migration
        // Schema::create('password_reset_tokens', function (Blueprint $table) {
        //     $table->string('email')->primary();
        //     $table->string('token');
        //     $table->timestamp('created_at')->nullable();
        // });

        if (!Schema::hasTable('email_verification_tokens')) {
            Schema::create('email_verification_tokens', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('token');
                $table->timestamp('expires_at');
                $table->timestamp('created_at')->nullable();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index('token');
            });
        }
    }

    public function down(): void
    {
        // Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('email_verification_tokens');
    }
};
