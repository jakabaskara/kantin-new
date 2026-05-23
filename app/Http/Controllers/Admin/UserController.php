<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Requests\Admin\UserIndexRequest;
use App\Http\Resources\OutletResource;
use App\Http\Resources\UserResource;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * @var list<string>
     */
    private const ROLES = [
        'Admin',
        'Cashier',
        'Customer',
    ];

    public function index(UserIndexRequest $request): Response
    {
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));
        $role = $filters['role'] ?? null;
        $outletId = $filters['outlet'] ?? null;

        $users = User::query()
            ->with('outlet:id,name')
            ->when($search !== '', function ($query) use ($search): void {
                $escapedSearch = addcslashes($search, '%_\\');

                $query->where(function ($query) use ($escapedSearch): void {
                    $query
                        ->where('username', 'like', "%{$escapedSearch}%")
                        ->orWhere('full_name', 'like', "%{$escapedSearch}%");
                });
            })
            ->when($role, function ($query) use ($role): void {
                $roles = match ($role) {
                    'Cashier' => ['Cashier', 'Kasir'],
                    'Customer' => ['Customer', 'Mahasiswa'],
                    default => [$role],
                };

                $query->whereIn('role', $roles);
            })
            ->when($outletId, fn ($query) => $query->where('outlet_id', $outletId))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => UserResource::make($user)->resolve());

        $outlets = Outlet::query()
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'qris_image_url']);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'outlets' => OutletResource::collection($outlets)->resolve(),
            'filters' => [
                'search' => $search,
                'role' => $role,
                'outlet' => $outletId ? (int) $outletId : null,
            ],
            'roles' => self::ROLES,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::query()->create([
            'name' => $validated['fullName'] ?? $validated['username'],
            'username' => $validated['username'],
            'full_name' => $validated['fullName'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'outlet_id' => $this->outletIdForRole($validated['role'], $validated['outletId'] ?? null),
        ]);

        return redirect()->route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $attributes = [
            'name' => $validated['fullName'] ?? $validated['username'],
            'username' => $validated['username'],
            'full_name' => $validated['fullName'] ?? null,
            'role' => $validated['role'],
            'outlet_id' => $this->outletIdForRole($validated['role'], $validated['outletId'] ?? null),
        ];

        if (($validated['password'] ?? '') !== '') {
            $attributes['password'] = Hash::make($validated['password']);
        }

        $user->update($attributes);

        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        Gate::authorize('delete', $user);

        $user->delete();

        return redirect()->route('admin.users.index');
    }

    private function outletIdForRole(string $role, ?int $outletId): ?int
    {
        if ($role !== 'Cashier') {
            return null;
        }

        return $outletId;
    }
}
