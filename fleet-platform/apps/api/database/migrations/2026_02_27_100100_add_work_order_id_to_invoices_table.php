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
        Schema::table('invoices', function (Blueprint $table) {
            $table->uuid('work_order_id')->nullable()->after('customer_tenant_id');
            $table->foreign('work_order_id')->references('id')->on('work_orders')->onDelete('set null');
            $table->index('work_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['work_order_id']);
            $table->dropIndex(['work_order_id']);
            $table->dropColumn('work_order_id');
        });
    }
};
