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
        Schema::table('work_orders', function (Blueprint $table) {
            $table->string('owner_decision')->default('pending')->after('status');
            $table->text('shop_notes')->nullable()->after('owner_decision');
            $table->text('job_details')->nullable()->after('shop_notes');
            $table->index('owner_decision');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropIndex(['owner_decision']);
            $table->dropColumn(['owner_decision', 'shop_notes', 'job_details']);
        });
    }
};
