<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('admin:id,name,email');

        // Search by name, slug, or description
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $categories = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $admin = $request->user();

        // Generate unique slug if not explicitly passed
        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $category = Category::create([
            'admin_id' => $admin->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'category_created',
            "Admin '{$admin->name}' created clinic category '{$category->name}' (ID: {$category->id}).",
            $request
        );

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category->load('admin:id,name,email'),
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::with('admin:id,name,email')->findOrFail($id);

        return response()->json($category);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        // Resolve slug
        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'category_updated',
            "Admin '{$admin->name}' updated clinic category '{$category->name}' (ID: {$category->id}).",
            $request
        );

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category->fresh()->load('admin:id,name,email'),
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $categoryName = $category->name;

        $category->delete();

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'category_deleted',
            "Admin '{$admin->name}' deleted category '{$categoryName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => "Category '{$categoryName}' deleted successfully.",
        ]);
    }

    /**
     * Quick statistics for categories.
     */
    public function stats(): JsonResponse
    {
        $total = Category::count();

        return response()->json([
            'total' => $total,
        ]);
    }
}
