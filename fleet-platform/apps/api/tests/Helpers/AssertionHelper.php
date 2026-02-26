<?php

namespace Tests\Helpers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

/**
 * Helper class for common test assertions and utilities
 */
class AssertionHelper
{
    /**
     * Assert that a JSON response has pagination structure
     */
    public static function assertHasPagination(\Illuminate\Testing\TestResponse $response): void
    {
        $response->assertJsonStructure([
            'data',
            'links' => [
                'first',
                'last',
                'prev',
                'next',
            ],
            'meta' => [
                'current_page',
                'from',
                'last_page',
                'per_page',
                'to',
                'total',
            ],
        ]);
    }

    /**
     * Assert that a JSON response has standard resource structure
     */
    public static function assertHasResourceStructure(
        \Illuminate\Testing\TestResponse $response,
        array $structure
    ): void {
        $response->assertJsonStructure([
            'data' => $structure,
        ]);
    }

    /**
     * Assert that a file was uploaded to storage
     */
    public static function assertFileUploaded(string $disk, string $path): void
    {
        Storage::disk($disk)->assertExists($path);
    }

    /**
     * Assert that a file was deleted from storage
     */
    public static function assertFileDeleted(string $disk, string $path): void
    {
        Storage::disk($disk)->assertMissing($path);
    }

    /**
     * Assert that an event was dispatched with specific data
     */
    public static function assertEventDispatchedWith(string $event, callable $callback): void
    {
        Event::assertDispatched($event, $callback);
    }

    /**
     * Assert that a job was pushed to queue with specific data
     */
    public static function assertJobPushedWith(string $job, callable $callback): void
    {
        Queue::assertPushed($job, $callback);
    }

    /**
     * Assert that response has tenant isolation (doesn't contain other tenant's data)
     */
    public static function assertTenantIsolation(
        \Illuminate\Testing\TestResponse $response,
        string $tenantId
    ): void {
        $data = $response->json('data');
        
        if (is_array($data)) {
            foreach ($data as $item) {
                if (isset($item['tenant_id'])) {
                    \PHPUnit\Framework\Assert::assertEquals(
                        $tenantId,
                        $item['tenant_id'],
                        'Response contains data from other tenants'
                    );
                }
            }
        }
    }

    /**
     * Assert that database has timestamps
     */
    public static function assertHasTimestamps(string $table, array $attributes): void
    {
        \Illuminate\Support\Facades\DB::table($table)
            ->where($attributes)
            ->whereNotNull('created_at')
            ->whereNotNull('updated_at')
            ->firstOrFail();
    }

    /**
     * Assert that a broadcast event was sent to specific channels
     */
    public static function assertBroadcastToChannels(string $event, array $channels): void
    {
        Event::assertDispatched($event, function ($e) use ($channels) {
            $broadcastChannels = $e->broadcastOn();
            
            foreach ($channels as $expectedChannel) {
                $found = false;
                foreach ($broadcastChannels as $channel) {
                    if ($channel->name === $expectedChannel) {
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    return false;
                }
            }
            
            return true;
        });
    }
}
