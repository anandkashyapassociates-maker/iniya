<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SuperAdminInventoryController extends Controller
{
    /**
     * Executive Overview & Inventory Analytics Dashboard.
     */
    public function overview(): JsonResponse
    {
        $totalProducts = InventoryProduct::count();
        $activeProducts = InventoryProduct::where('status', 'active')->count();
        $inactiveProducts = InventoryProduct::where('status', 'inactive')->count();
        $totalCategories = InventoryCategory::count();
        $totalBrands = InventoryBrand::count();
        $contributingAdminsCount = InventoryProduct::distinct('created_by_admin_id')->count('created_by_admin_id');

        // Recently added products
        $recentProducts = InventoryProduct::with(['category:id,name', 'brand:id,name', 'creator:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Products breakdown by Category
        $productsByCategory = InventoryCategory::withCount('products')
            ->orderBy('products_count', 'desc')
            ->limit(6)
            ->get(['id', 'name', 'status'])
            ->map(fn ($cat) => [
                'name' => $cat->name,
                'count' => $cat->products_count,
            ]);

        // Products breakdown by Brand
        $productsByBrand = InventoryBrand::withCount('products')
            ->orderBy('products_count', 'desc')
            ->limit(6)
            ->get(['id', 'name', 'status'])
            ->map(fn ($b) => [
                'name' => $b->name,
                'count' => $b->products_count,
            ]);

        // Products breakdown by Type
        $productsByType = InventoryProduct::select('product_type', DB::raw('count(*) as count'))
            ->groupBy('product_type')
            ->orderBy('count', 'desc')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->product_type,
                'count' => (int) $row->count,
            ]);

        // Admin-wise product creation summary
        $adminProductReport = Admin::whereHas('inventoryProducts')
            ->withCount('inventoryProducts')
            ->orderBy('inventory_products_count', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'email'])
            ->map(fn ($admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'count' => $admin->inventory_products_count,
            ]);

        return response()->json([
            'summary' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'inactive_products' => $inactiveProducts,
                'total_categories' => $totalCategories,
                'total_brands' => $totalBrands,
                'contributing_admins_count' => $contributingAdminsCount,
            ],
            'recent_products' => $recentProducts,
            'products_by_category' => $productsByCategory,
            'products_by_brand' => $productsByBrand,
            'products_by_type' => $productsByType,
            'admin_product_report' => $adminProductReport,
        ]);
    }

    /**
     * All Products Report with full Admin attribution.
     */
    public function products(Request $request): JsonResponse
    {
        $query = InventoryProduct::with([
            'category:id,name,slug',
            'brand:id,name,slug',
            'creator:id,name,email,mobile',
        ]);

        if ($search = $request->input('search')) {
            $query->where('product_name', 'like', "%{$search}%");
        }

        if ($adminId = $request->input('admin_id')) {
            $query->where('created_by_admin_id', $adminId);
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId = $request->input('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($productType = $request->input('product_type')) {
            $query->where(function ($q) use ($productType) {
                $q->where('product_type', $productType)
                    ->orWhere('custom_product_type', $productType);
            });
        }

        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $products = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Show single product details.
     */
    public function showProduct(int $id): JsonResponse
    {
        $product = InventoryProduct::with(['category', 'brand', 'creator'])->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Super Admin update product.
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['required', 'exists:inventory_categories,id'],
            'brand_id' => ['nullable', 'exists:inventory_brands,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'business_unit' => ['required', 'string', 'max:50'],
            'product_type' => ['required', 'string', 'max:50'],
            'custom_product_type' => ['nullable', 'string', 'max:100', 'required_if:product_type,Other'],
            'status' => ['nullable', 'in:active,inactive'],
            'product_image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $superAdmin = $request->user();

        DB::transaction(function () use ($request, $product, $validated) {
            $imagePath = $product->product_image;

            if ($request->hasFile('product_image')) {
                if ($product->product_image && Storage::disk('public')->exists($product->product_image)) {
                    Storage::disk('public')->delete($product->product_image);
                }
                $imagePath = $request->file('product_image')->store('inventory/products', 'public');
            } elseif ($request->boolean('remove_image')) {
                if ($product->product_image && Storage::disk('public')->exists($product->product_image)) {
                    Storage::disk('public')->delete($product->product_image);
                }
                $imagePath = null;
            }

            // Note: Original creator admin ID is strictly preserved!
            $product->update([
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'product_image' => $imagePath,
                'product_name' => $validated['product_name'],
                'business_unit' => $validated['business_unit'],
                'product_type' => $validated['product_type'],
                'custom_product_type' => $validated['product_type'] === 'Other' ? ($validated['custom_product_type'] ?? null) : null,
                'status' => $validated['status'] ?? $product->status,
            ]);
        });

        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_product_updated_by_superadmin',
            "Super Admin '{$superAdmin->name}' modified product '{$product->product_name}' (ID: {$product->id}).",
            $request
        );

        return response()->json([
            'message' => "Product '{$product->product_name}' updated successfully by Super Admin.",
            'product' => $product->fresh()->load(['category', 'brand', 'creator']),
        ]);
    }

    /**
     * Toggle or update product status.
     */
    public function updateProductStatus(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $product->update([
            'status' => $validated['status'],
        ]);

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_product_status_toggled',
            "Super Admin '{$superAdmin->name}' changed product '{$product->product_name}' status to '{$validated['status']}'.",
            $request
        );

        return response()->json([
            'message' => "Product status updated to {$validated['status']}.",
            'product' => $product,
        ]);
    }

    /**
     * Delete product (Super Admin Executive Privilege).
     */
    public function destroyProduct(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);
        $productName = $product->product_name;

        $product->delete();

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_product_deleted_by_superadmin',
            "Super Admin '{$superAdmin->name}' deleted product '{$productName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => "Product '{$productName}' deleted successfully by Super Admin.",
        ]);
    }

    /**
     * Category list for Super Admin.
     */
    public function categories(Request $request): JsonResponse
    {
        $query = InventoryCategory::with('creator:id,name,email,mobile')
            ->withCount('products');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $categories = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($categories);
    }

    /**
     * Update category by Super Admin.
     */
    public function updateCategory(Request $request, int $id): JsonResponse
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

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_category_updated_by_superadmin',
            "Super Admin '{$superAdmin->name}' updated category '{$category->name}'.",
            $request
        );

        return response()->json([
            'message' => "Category '{$category->name}' updated successfully.",
            'category' => $category->fresh()->load('creator:id,name,email')->loadCount('products'),
        ]);
    }

    /**
     * Delete category by Super Admin (with dependency protection).
     */
    public function destroyCategory(Request $request, int $id): JsonResponse
    {
        $category = InventoryCategory::withCount('products')->findOrFail($id);

        if ($category->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because it contains {$category->products_count} assigned product(s). Please reassign or delete these products first.",
            ], 422);
        }

        $categoryName = $category->name;
        $category->delete();

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_category_deleted_by_superadmin',
            "Super Admin '{$superAdmin->name}' deleted category '{$categoryName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => "Category '{$categoryName}' deleted successfully by Super Admin.",
        ]);
    }

    /**
     * Brand list for Super Admin.
     */
    public function brands(Request $request): JsonResponse
    {
        $query = InventoryBrand::with('creator:id,name,email,mobile')
            ->withCount('products');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $brands = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($brands);
    }

    /**
     * Update brand by Super Admin.
     */
    public function updateBrand(Request $request, int $id): JsonResponse
    {
        $brand = InventoryBrand::findOrFail($id);

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

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_brand_updated_by_superadmin',
            "Super Admin '{$superAdmin->name}' updated brand '{$brand->name}'.",
            $request
        );

        return response()->json([
            'message' => "Brand '{$brand->name}' updated successfully.",
            'brand' => $brand->fresh()->load('creator:id,name,email')->loadCount('products'),
        ]);
    }

    /**
     * Delete brand by Super Admin (with dependency protection).
     */
    public function destroyBrand(Request $request, int $id): JsonResponse
    {
        $brand = InventoryBrand::withCount('products')->findOrFail($id);

        if ($brand->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete brand '{$brand->name}' because it is assigned to {$brand->products_count} existing product(s). Please reassign or delete these products first.",
            ], 422);
        }

        $brandName = $brand->name;
        $brand->delete();

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'inventory_brand_deleted_by_superadmin',
            "Super Admin '{$superAdmin->name}' deleted brand '{$brandName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => "Brand '{$brandName}' deleted successfully by Super Admin.",
        ]);
    }

    /**
     * Detailed Admin-wise product creation report.
     */
    public function adminReport(): JsonResponse
    {
        $admins = Admin::withCount([
            'inventoryProducts as total_products',
            'inventoryProducts as active_products' => function ($q) {
                $q->where('status', 'active');
            },
            'inventoryProducts as inactive_products' => function ($q) {
                $q->where('status', 'inactive');
            },
        ])
            ->orderBy('total_products', 'desc')
            ->get(['id', 'name', 'email', 'mobile', 'status', 'created_at']);

        return response()->json([
            'admins' => $admins,
        ]);
    }
}

