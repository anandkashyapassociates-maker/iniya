<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\InventoryBrand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InventoryBrandController extends Controller
{
    /**
     * Display a listing of inventory brands.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryBrand::with('creator:id,name,email')
            ->withCount('products')
            ->withExists(['products as has_used_products' => fn ($q) => $q->where('is_used', true)]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $brands = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($brands);
    }

    /**
     * Compact dropdown options for product forms.
     */
    public function dropdown(): JsonResponse
    {
        $brands = InventoryBrand::active()
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'slug']);

        return response()->json($brands);
    }

    /**
     * Store a newly created inventory brand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:inventory_brands,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'logo' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ], [
            'logo.max' => 'Brand logo cannot exceed 5MB.',
            'logo.mimes' => 'Brand logo must be of type: JPG, JPEG, PNG, or WEBP.',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('inventory/brands', 'public');
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (InventoryBrand::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $admin = $request->user();

        $brand = InventoryBrand::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'logo' => $logoPath,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $admin ? $admin->id : null,
        ]);

        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_brand_created',
                "Admin '{$admin->name}' created inventory brand '{$brand->name}'.",
                $request
            );
        }

        return response()->json([
            'message' => "Brand '{$brand->name}' created successfully.",
            'brand' => $brand->load('creator:id,name,email')->loadCount('products'),
        ], 201);
    }

    /**
     * Display the specified inventory brand.
     */
    public function show(int $id): JsonResponse
    {
        $brand = InventoryBrand::with('creator:id,name,email')
            ->withCount('products')
            ->findOrFail($id);

        return response()->json($brand);
    }

    /**
     * Update the specified inventory brand.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $brand = InventoryBrand::findOrFail($id);

        if ((int) $brand->created_by !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only edit brands created by you.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('inventory_brands', 'name')->ignore($brand->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'logo' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        $logoPath = $brand->logo;

        if ($request->hasFile('logo')) {
            if ($brand->logo && Storage::disk('public')->exists($brand->logo)) {
                Storage::disk('public')->delete($brand->logo);
            }
            $logoPath = $request->file('logo')->store('inventory/brands', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($brand->logo && Storage::disk('public')->exists($brand->logo)) {
                Storage::disk('public')->delete($brand->logo);
            }
            $logoPath = null;
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (InventoryBrand::where('slug', $slug)->where('id', '!=', $brand->id)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $brand->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'logo' => $logoPath,
            'status' => $validated['status'] ?? $brand->status,
        ]);

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_brand_updated',
                "Admin '{$admin->name}' updated inventory brand '{$brand->name}'.",
                $request
            );
        }

        return response()->json([
            'message' => "Brand '{$brand->name}' updated successfully.",
            'brand' => $brand->fresh()->load('creator:id,name,email')->loadCount('products'),
        ]);
    }

    /**
     * Remove the specified inventory brand.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $brand = InventoryBrand::withCount('products')->findOrFail($id);

        if ((int) $brand->created_by !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only delete brands created by you.',
            ], 403);
        }

        if ($brand->products()->where('is_used', true)->exists()) {
            return response()->json([
                'message' => "Cannot delete brand '{$brand->name}' because it contains products currently in use.",
            ], 422);
        }

        if ($brand->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete brand '{$brand->name}' because it is assigned to {$brand->products_count} existing product(s). Please reassign or delete the products first.",
            ], 422);
        }

        $brandName = $brand->name;
        $brand->delete();

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_brand_deleted',
                "Admin '{$admin->name}' deleted inventory brand '{$brandName}' (ID: {$id}).",
                $request
            );
        }

        return response()->json([
            'message' => "Brand '{$brandName}' deleted successfully.",
        ]);
    }
}
