<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProcessDocumentUploadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $documentId;

    public function __construct(string $documentId)
    {
        $this->documentId = $documentId;
    }

    public function handle(): void
    {
        $document = Document::find($this->documentId);

        if (!$document) {
            Log::warning('Document not found for processing', ['document_id' => $this->documentId]);
            return;
        }

        $disk = config('filesystems.default');

        if (!Storage::disk($disk)->exists($document->storage_key)) {
            Log::error('Document file missing from storage', [
                'document_id' => $document->id,
                'storage_key' => $document->storage_key,
            ]);
            return;
        }

        // Placeholder: could implement virus scan, thumbnail generation, OCR, etc.
        Log::info('Document processed successfully', [
            'document_id' => $document->id,
            'size' => $document->size,
            'mime_type' => $document->mime_type,
        ]);
    }
}
