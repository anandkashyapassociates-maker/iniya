<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\InventoryCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InventoryCategoryController extends Controller
{
    /**
     * Display a listing of inventory categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryCategory::with('creator:id,name,email')
            ->withCount('products');

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
        $categories = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($categories);
    }

    /**
     * Compact dropdown options for product forms.
     */
    public function dropdown(): JsonResponse
    {
        $categories = InventoryCategory::active()
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'slug']);

        return response()->json($categories);
    }

    /**
     * Store a newly created inventory category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:inventory_categories,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ], [
            'image.max' => 'Category image cannot exceed 5MB.',
            'image.mimes' => 'Category image must be of type: JPG, JPEG, PNG, or WEBP.',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('inventory/categories', 'public');
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (InventoryCategory::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $admin = $request->user();

        $category = InventoryCategory::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'status' => $validated['status'] ?? 'active',
            'created_by' => $admin ? $admin->id : null,
        ]);

        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_category_created',
                "Admin '{$admin->name}' created inventory category '{$category->name}'.",
                $request
            );
        }

        return response()->json([
            'message' => "Category '{$category->name}' created successfully.",
            'category' => $category->load('creator:id,name,email')->loadCount('products'),
        ], 201);
    }

    /**
     * Display the specified inventory category.
     */
    public function show(int $id): JsonResponse
    {
        $category = InventoryCategory::with('creator:id,name,email')
            ->withCount('products')
            ->findOrFail($id);

        return response()->json($category);
    }

    /**
     * Update the specified inventory category.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = InventoryCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('inventory_categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $imagePath = $category->image;

        if ($request->hasFile('image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = $request->file('image')->store('inventory/categories', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = null;
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (InventoryCategory::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'status' => $validated['status'] ?? $category->status,
        ]);

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_category_updated',
                "Admin '{$admin->name}' updated inventory category '{$category->name}'.",
                $request
            );
        }

        return response()->json([
            'message' => "Category '{$category->name}' updated successfully.",
            'category' => $category->fresh()->load('creator:id,name,email')->loadCount('products'),
        ]);
    }

    /**
     * Remove the specified inventory category.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = InventoryCategory::withCount('products')->findOrFail($id);

        if ($category->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because it is assigned to {$category->products_count} existing product(s). Please reassign or delete the products first.",
            ], 422);
        }

        $categoryName = $category->name;
        $category->delete();

        $admin = $request->user();
        if ($admin) {
            AdminActivityLog::record(
                'admin',
                $admin->id,
                'inventory_category_deleted',
                "Admin '{$admin->name}' deleted inventory category '{$categoryName}' (ID: {$id}).",
                $request
            );
        }

        return response()->json([
            'message' => "Category '{$categoryName}' deleted successfully.",
        ]);
    }
}

