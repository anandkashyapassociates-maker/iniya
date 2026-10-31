<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        // Filter by active status
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $statusInput = strtolower((string) $request->input('status'));
            if ($statusInput === 'active' || $statusInput === 'true' || $statusInput === '1') {
                $query->where('is_active', true);
            } elseif ($statusInput === 'inactive' || $statusInput === 'false' || $statusInput === '0') {
                $query->where('is_active', false);
            }
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
            'image' => ['nullable'],
            'is_active' => ['sometimes', 'boolean'],
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

        // Handle Image Upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:5120'],
            ], [
                'image.file' => 'The category icon/photo must be a valid image file.',
                'image.mimes' => 'The image must be of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The image size cannot exceed 5MB.',
            ]);
            $imagePath = $request->file('image')->store('categories', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'categories/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $imagePath = $fileName;
                }
            }
        }

        $category = Category::create([
            'admin_id' => $admin->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'is_active' => $validated['is_active'] ?? true,
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
            'image' => ['nullable'],
            'remove_image' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Resolve slug
        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $imagePath = $category->image;

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:5120'],
            ], [
                'image.file' => 'The category icon/photo must be a valid image file.',
                'image.mimes' => 'The image must be of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The image size cannot exceed 5MB.',
            ]);

            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = $request->file('image')->store('categories', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'categories/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $imagePath = $fileName;
                }
            }
        } elseif ($request->boolean('remove_image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = null;
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'is_active' => $validated['is_active'] ?? $category->is_active,
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

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

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
        $active = Category::where('is_active', true)->count();
        $inactive = Category::where('is_active', false)->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
        ]);
    }
}
