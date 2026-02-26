<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Security events log
        Schema::create('security_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignUuid('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('event_type'); // login_success, login_failed, password_changed, etc.
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable(); // Additional context
            $table->timestamp('created_at');
            
            $table->index(['user_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
        });

        // Account lockout tracking
        Schema::create('account_lockouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->integer('failed_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });

        // Password history (prevent reuse)
        Schema::create('password_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->string('password_hash');
            $table->timestamp('created_at');

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_histories');
        Schema::dropIfExists('account_lockouts');
        Schema::dropIfExists('security_events');
    }
};
