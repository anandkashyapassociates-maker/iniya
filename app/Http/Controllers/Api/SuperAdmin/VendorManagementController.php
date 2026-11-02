<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorManagementController extends Controller
{
    /**
     * Display a listing of Vendors with search, filtering, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::with('superAdmin:id,name,email');

        // Parameterized search across vendor_code, vendor_name, company_name, email, mobile, gst_number
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('vendor_code', 'like', "%{$search}%")
                    ->orWhere('vendor_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('gst_number', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $statusInput = $request->input('status');
            if (in_array($statusInput, ['active', 'inactive', 'blocked'])) {
                $query->where('status', $statusInput);
            }
        }

        // Vendor type filter
        if ($vendorType = $request->input('vendor_type')) {
            if ($vendorType !== '' && $vendorType !== 'all') {
                $query->where('vendor_type', $vendorType);
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
            'id', 'vendor_code', 'vendor_name', 'company_name',
            'email', 'mobile', 'vendor_type', 'city', 'gst_number',
            'status', 'created_at', 'updated_at',
        ];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts)
            ? $request->input('sort_by')
            : 'created_at';
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection)->orderBy('id', 'desc');

        $perPage = min((int) $request->input('per_page', 10), 50);
        $vendors = $query->paginate($perPage);

        return response()->json($vendors);
    }

    /**
     * Preview the next available Vendor Code.
     */
    public function previewCode(): JsonResponse
    {
        $code = Vendor::generateUniqueCode();

        return response()->json([
            'preview_code' => $code,
        ]);
    }

    /**
     * Get distinct vendor types for filter dropdowns.
     */
    public function types(): JsonResponse
    {
        $dbTypes = Vendor::whereNotNull('vendor_type')
            ->where('vendor_type', '!=', '')
            ->distinct()
            ->pluck('vendor_type');

        $standardTypes = ['Supplier', 'Manufacturer', 'Distributor', 'Wholesaler', 'Service Provider', 'Contractor', 'Other'];
        $allTypes = collect($standardTypes)->merge($dbTypes)->unique()->values();

        return response()->json([
            'types' => $allTypes,
        ]);
    }

    /**
     * Store a newly created Vendor.
     */
    public function store(Request $request): JsonResponse
    {
        // Trim strings before validation
        $request->merge([
            'email' => $request->filled('email') ? strtolower(trim($request->input('email'))) : null,
            'gst_number' => $request->filled('gst_number') ? strtoupper(trim($request->input('gst_number'))) : null,
            'pan_number' => $request->filled('pan_number') ? strtoupper(trim($request->input('pan_number'))) : null,
        ]);

        $validated = $request->validate([
            'vendor_name' => ['required', 'string', 'max:150'],
            'company_name' => ['nullable', 'string', 'max:180'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:vendors,email'],
            'mobile' => ['required', 'string', 'max:20'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'vendor_type' => ['nullable', 'string', 'max:100'],
            'gst_number' => ['nullable', 'string', 'max:30', 'unique:vendors,gst_number'],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        $status = $validated['status'] ?? 'active';
        $superAdmin = $request->user();

        // Concurrency-safe backend generated Vendor Code
        $vendorCode = Vendor::generateUniqueCode();

        $vendor = Vendor::create([
            'vendor_code' => $vendorCode,
            'created_by_superadmin_id' => $superAdmin->id,
            'vendor_name' => $validated['vendor_name'],
            'company_name' => $validated['company_name'] ?? null,
            'email' => $validated['email'],
            'mobile' => $validated['mobile'],
            'alternate_mobile' => $validated['alternate_mobile'] ?? null,
            'vendor_type' => $validated['vendor_type'] ?? null,
            'gst_number' => $validated['gst_number'] ?? null,
            'pan_number' => $validated['pan_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'country' => $validated['country'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => $status,
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'vendor_created',
            "Super Admin '{$superAdmin->name}' created Vendor '{$vendor->vendor_name}' ({$vendor->vendor_code}).",
            $request
        );

        return response()->json([
            'message' => 'Vendor created successfully.',
            'vendor' => $vendor->load('superAdmin:id,name,email'),
        ], 201);
    }

    /**
     * Display the specified Vendor.
     */
    public function show(string $id): JsonResponse
    {
        $vendor = Vendor::with('superAdmin:id,name,email')->find($id);

        if (! $vendor) {
            return response()->json([
                'message' => 'Vendor not found.',
            ], 404);
        }

        return response()->json([
            'vendor' => $vendor,
        ]);
    }

    /**
     * Update the specified Vendor.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $vendor = Vendor::find($id);

        if (! $vendor) {
            return response()->json([
                'message' => 'Vendor not found.',
            ], 404);
        }

        // Normalize email and tax numbers
        $request->merge([
            'email' => $request->filled('email') ? strtolower(trim($request->input('email'))) : null,
            'gst_number' => $request->filled('gst_number') ? strtoupper(trim($request->input('gst_number'))) : null,
            'pan_number' => $request->filled('pan_number') ? strtoupper(trim($request->input('pan_number'))) : null,
        ]);

        $validated = $request->validate([
            'vendor_name' => ['required', 'string', 'max:150'],
            'company_name' => ['nullable', 'string', 'max:180'],
            'email' => ['required', 'string', 'email', 'max:150', Rule::unique('vendors')->ignore($vendor->id)],
            'mobile' => ['required', 'string', 'max:20'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'vendor_type' => ['nullable', 'string', 'max:100'],
            'gst_number' => ['nullable', 'string', 'max:30', Rule::unique('vendors')->ignore($vendor->id)],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        // Explicit allowlist: never allow vendor_code, id, or created_by_superadmin_id to be altered
        $allowlist = [
            'vendor_name', 'company_name', 'email', 'mobile',
            'alternate_mobile', 'vendor_type', 'gst_number', 'pan_number',
            'address', 'city', 'state', 'postal_code', 'country',
            'contact_person', 'notes', 'status',
        ];

        $dataToUpdate = [];
        foreach ($allowlist as $field) {
            if (array_key_exists($field, $validated)) {
                $dataToUpdate[$field] = $validated[$field];
            }
        }

        $vendor->update($dataToUpdate);

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'vendor_updated',
            "Super Admin '{$superAdmin->name}' updated Vendor '{$vendor->vendor_name}' ({$vendor->vendor_code}).",
            $request
        );

        return response()->json([
            'message' => 'Vendor updated successfully.',
            'vendor' => $vendor->fresh()->load('superAdmin:id,name,email'),
        ]);
    }

    /**
     * Update vendor status (active, inactive, blocked).
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $vendor = Vendor::find($id);

        if (! $vendor) {
            return response()->json([
                'message' => 'Vendor not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'blocked'])],
        ]);

        $vendor->update([
            'status' => $validated['status'],
        ]);

        $superAdmin = $request->user();
        $statusText = match ($validated['status']) {
            'blocked' => 'blocked',
            'inactive' => 'deactivated',
            default => 'activated',
        };

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'vendor_status_changed',
            "Super Admin '{$superAdmin->name}' {$statusText} Vendor '{$vendor->vendor_name}' ({$vendor->vendor_code}).",
            $request
        );

        return response()->json([
            'message' => "Vendor {$statusText} successfully.",
            'vendor' => $vendor->fresh()->load('superAdmin:id,name,email'),
        ]);
    }
}
