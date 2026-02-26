<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Jobs\ProcessDocumentUploadJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'nullable|string|max:100',
            'entity_id' => 'nullable|uuid',
        ]);

        $query = Document::where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('created_at');

        if (!empty($validated['entity_type'])) {
            $query->where('entity_type', $validated['entity_type']);
        }

        if (!empty($validated['entity_id'])) {
            $query->where('entity_id', $validated['entity_id']);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480',
            'entity_type' => 'nullable|string|max:100',
            'entity_id' => 'nullable|uuid',
        ]);

        $file = $request->file('file');
        $tenantId = $request->user()->tenant_id;
        $extension = $file->getClientOriginalExtension();
        $storageName = (string) Str::uuid();
        if ($extension !== '') {
            $storageName .= '.' . $extension;
        }

        $storageKey = 'documents/' . $tenantId . '/' . $storageName;
        $disk = config('filesystems.default');

        Storage::disk($disk)->putFileAs('documents/' . $tenantId, $file, $storageName);

        $document = Document::create([
            'tenant_id' => $tenantId,
            'storage_key' => $storageKey,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType() ?: 'application/octet-stream',
            'size' => $file->getSize(),
            'checksum' => hash_file('sha256', $file->getRealPath()),
            'entity_type' => $validated['entity_type'] ?? null,
            'entity_id' => $validated['entity_id'] ?? null,
        ]);

        // Dispatch background processing job
        ProcessDocumentUploadJob::dispatch($document->id);

        return response()->json($document, 201);
    }

    public function show(Request $request, Document $document)
    {
        if ($document->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        return response()->json($document);
    }

    public function download(Request $request, Document $document)
    {
        if ($document->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $disk = config('filesystems.default');

        if (!Storage::disk($disk)->exists($document->storage_key)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk($disk)->download($document->storage_key, $document->original_filename);
    }

    public function destroy(Request $request, Document $document)
    {
        if ($document->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $disk = config('filesystems.default');
        Storage::disk($disk)->delete($document->storage_key);
        $document->delete();

        return response()->json(null, 204);
    }
}
