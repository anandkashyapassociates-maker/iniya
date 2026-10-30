<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\SalesMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SalesMemberManagementController extends Controller
{
    /**
     * Display a listing of Sales Members with search, filtering, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SalesMember::with('superAdmin:id,name,email');

        // Parameterized search across sales_code, name, email, mobile, designation, department, territory, city
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sales_code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('territory', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $statusInput = $request->input('status');
            if (in_array($statusInput, ['active', 'inactive', 'blocked'])) {
                $query->where('status', $statusInput);
            }
        }

        // Department filter
        if ($department = $request->input('department')) {
            if ($department !== '' && $department !== 'all') {
                $query->where('department', $department);
            }
        }

        // Employment type filter
        if ($empType = $request->input('employment_type')) {
            if ($empType !== '' && $empType !== 'all') {
                $query->where('employment_type', $empType);
            }
        }

        // Territory filter
        if ($territory = $request->input('territory')) {
            if ($territory !== '' && $territory !== 'all') {
                $query->where('territory', $territory);
            }
        }

        // City filter
        if ($city = $request->input('city')) {
            if ($city !== '' && $city !== 'all') {
                $query->where('city', $city);
            }
        }

        // Dynamic sorting
        $allowedSorts = [
            'id', 'sales_code', 'name', 'email', 'mobile',
            'designation', 'department', 'employment_type', 'territory',
            'city', 'joining_date', 'status', 'created_at', 'updated_at',
        ];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts)
            ? $request->input('sort_by')
            : 'created_at';
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection);

        $perPage = min((int) $request->input('per_page', 10), 50);
        $members = $query->paginate($perPage);

        return response()->json($members);
    }

    /**
     * Preview the next available Sales Code.
     */
    public function previewCode(): JsonResponse
    {
        $code = SalesMember::generateUniqueCode();

        return response()->json([
            'preview_code' => $code,
        ]);
    }

    /**
     * Get distinct departments for filter dropdowns.
     */
    public function departments(): JsonResponse
    {
        $dbDepartments = SalesMember::whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department');

        $standard = [
            'Enterprise Sales',
            'Direct Sales',
            'Retail Sales',
            'Channel Partners',
            'Inside Sales',
            'B2B Sales',
            'International Sales',
        ];
        $all = collect($standard)->merge($dbDepartments)->unique()->values();

        return response()->json([
            'departments' => $all,
        ]);
    }

    /**
     * Get distinct territories for filter dropdowns.
     */
    public function territories(): JsonResponse
    {
        $dbTerritories = SalesMember::whereNotNull('territory')
            ->where('territory', '!=', '')
            ->distinct()
            ->pluck('territory');

        $standard = [
            'North Zone',
            'South Zone',
            'East Zone',
            'West Zone',
            'Central Zone',
            'National',
            'International',
        ];
        $all = collect($standard)->merge($dbTerritories)->unique()->values();

        return response()->json([
            'territories' => $all,
        ]);
    }

    /**
     * Store a newly created Sales Member.
     */
    public function store(Request $request): JsonResponse
    {
        // Pre-trim strings
        $request->merge([
            'email' => $request->filled('email') ? strtolower(trim($request->input('email'))) : null,
            'name' => $request->filled('name') ? trim($request->input('name')) : null,
            'mobile' => $request->filled('mobile') ? trim($request->input('mobile')) : null,
        ]);

        $photoRules = $request->hasFile('profile_photo')
            ? ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048']
            : ['nullable', 'string', 'max:255'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:sales_members,email'],
            'mobile' => ['required', 'string', 'max:20'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'max:30'],
            'profile_photo' => $photoRules,
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['nullable', 'date'],
            'territory' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        $superAdmin = $request->user();

        // Handle profile photo upload if provided as file
        $photoPath = null;
        if ($request->hasFile('profile_photo')) {
            $photoPath = $request->file('profile_photo')->store('sales_members', 'public');
        } elseif (isset($validated['profile_photo']) && is_string($validated['profile_photo'])) {
            $photoPath = $validated['profile_photo'];
        }

        $salesCode = SalesMember::generateUniqueCode();
        $status = $validated['status'] ?? SalesMember::STATUS_ACTIVE;

        $member = SalesMember::create([
            'sales_code' => $salesCode,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'],
            'alternate_mobile' => $validated['alternate_mobile'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'profile_photo' => $photoPath,
            'designation' => $validated['designation'] ?? null,
            'department' => $validated['department'] ?? null,
            'employment_type' => $validated['employment_type'] ?? null,
            'joining_date' => $validated['joining_date'] ?? null,
            'territory' => $validated['territory'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'country' => $validated['country'] ?? 'India',
            'address' => $validated['address'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => $status,
            'created_by_superadmin_id' => $superAdmin ? $superAdmin->id : null,
        ]);

        if ($superAdmin) {
            AdminActivityLog::record(
                'super_admin',
                $superAdmin->id,
                'sales_member_created',
                "Super Admin '{$superAdmin->name}' created Sales Member '{$member->name}' ({$member->sales_code}).",
                $request
            );
        }

        return response()->json([
            'message' => 'Sales member created successfully.',
            'sales_member' => $member->load('superAdmin:id,name,email'),
        ], 201);
    }

    /**
     * Display the specified Sales Member.
     */
    public function show(string $id): JsonResponse
    {
        $member = SalesMember::with('superAdmin:id,name,email')->find($id);

        if (! $member) {
            return response()->json([
                'message' => 'Sales member not found.',
            ], 404);
        }

        return response()->json([
            'sales_member' => $member,
        ]);
    }

    /**
     * Update the specified Sales Member.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $member = SalesMember::find($id);

        if (! $member) {
            return response()->json([
                'message' => 'Sales member not found.',
            ], 404);
        }

        // Pre-trim strings
        $request->merge([
            'email' => $request->filled('email') ? strtolower(trim($request->input('email'))) : null,
            'name' => $request->filled('name') ? trim($request->input('name')) : null,
            'mobile' => $request->filled('mobile') ? trim($request->input('mobile')) : null,
        ]);

        $photoRules = $request->hasFile('profile_photo')
            ? ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048']
            : ['nullable', 'string', 'max:255'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique('sales_members', 'email')->ignore($member->id),
            ],
            'mobile' => ['required', 'string', 'max:20'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'max:30'],
            'profile_photo' => $photoRules,
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['nullable', 'date'],
            'territory' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        // Explicit allowlist of editable fields: sales_code and created_by_superadmin_id are strictly protected
        $editable = [
            'name',
            'email',
            'mobile',
            'alternate_mobile',
            'gender',
            'designation',
            'department',
            'employment_type',
            'joining_date',
            'territory',
            'city',
            'state',
            'country',
            'address',
            'notes',
        ];

        foreach ($editable as $field) {
            if (array_key_exists($field, $validated)) {
                $member->{$field} = $validated[$field];
            }
        }

        if (array_key_exists('status', $validated)) {
            $member->status = $validated['status'];
        }

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            if ($member->profile_photo && Storage::disk('public')->exists($member->profile_photo)) {
                Storage::disk('public')->delete($member->profile_photo);
            }
            $member->profile_photo = $request->file('profile_photo')->store('sales_members', 'public');
        } elseif (array_key_exists('profile_photo', $validated)) {
            $member->profile_photo = $validated['profile_photo'];
        }

        $member->save();

        $superAdmin = $request->user();
        if ($superAdmin) {
            AdminActivityLog::record(
                'super_admin',
                $superAdmin->id,
                'sales_member_updated',
                "Super Admin '{$superAdmin->name}' updated Sales Member '{$member->name}' ({$member->sales_code}).",
                $request
            );
        }

        return response()->json([
            'message' => 'Sales member updated successfully.',
            'sales_member' => $member->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Update the status of the specified Sales Member.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $member = SalesMember::find($id);

        if (! $member) {
            return response()->json([
                'message' => 'Sales member not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        $oldStatus = $member->status;
        $member->status = $validated['status'];
        $member->save();

        $superAdmin = $request->user();
        if ($superAdmin) {
            AdminActivityLog::record(
                'super_admin',
                $superAdmin->id,
                'sales_member_status_updated',
                "Super Admin '{$superAdmin->name}' changed Sales Member '{$member->sales_code}' status from '{$oldStatus}' to '{$member->status}'.",
                $request
            );
        }

        return response()->json([
            'message' => "Sales member status updated to '{$member->status}'.",
            'sales_member' => $member->fresh()->load('superAdmin:id,name,email'),
        ]);
    }
}

