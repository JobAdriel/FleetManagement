<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::where('tenant_id', $request->user()->tenant_id)
            ->with('roles')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where('tenant_id', $request->user()->tenant_id),
            ],
            'password' => 'required|string|min:8',
            'roles' => 'sometimes|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = User::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return response()->json($user->load('roles'), 201);
    }

    public function show(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        return response()->json($user->load('roles', 'permissions'));
    }

    public function update(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->where('tenant_id', $request->user()->tenant_id)->ignore($user->id),
            ],
            'password' => 'sometimes|string|min:8',
            'roles' => 'sometimes|array',
            'roles.*' => 'exists:roles,name',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $updateData = collect($validated)->except('roles')->toArray();
        $user->update($updateData);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
