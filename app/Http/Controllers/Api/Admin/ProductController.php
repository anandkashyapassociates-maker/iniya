<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\InventoryProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of products created by admins.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryProduct::with([
            'category:id,name,slug',
            'brand:id,name,slug',
            'creator:id,name,email',
        ]);

        // Search by product name
        if ($search = $request->input('search')) {
            $query->where('product_name', 'like', "%{$search}%");
        }

        // Filter by category
        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // Filter by brand
        if ($brandId = $request->input('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        // Filter by product type
        if ($productType = $request->input('product_type')) {
            $query->where(function ($q) use ($productType) {
                $q->where('product_type', $productType)
                    ->orWhere('custom_product_type', $productType);
            });
        }

        // Filter by status
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $products = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:inventory_categories,id'],
            'brand_id' => ['nullable', 'exists:inventory_brands,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'business_unit' => ['required', 'string', 'max:50'],
            'product_unit' => ['nullable', 'integer', 'min:1'],
            'product_type' => ['required', 'string', 'max:50'],
            'custom_product_type' => ['nullable', 'string', 'max:100', 'required_if:product_type,Other'],
            'status' => ['nullable', 'in:active,inactive'],
            'product_image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ], [
            'category_id.required' => 'Please select a product category.',
            'category_id.exists' => 'Selected category is invalid.',
            'brand_id.exists' => 'Selected brand is invalid.',
            'product_image.max' => 'Product image size cannot exceed 5MB.',
            'product_image.mimes' => 'Image must be JPG, JPEG, PNG, or WEBP.',
            'custom_product_type.required_if' => 'Please specify the custom product type.',
        ]);

        $admin = $request->user();

        $product = DB::transaction(function () use ($request, $validated, $admin) {
            $imagePath = null;
            if ($request->hasFile('product_image')) {
                $imagePath = $request->file('product_image')->store('inventory/products', 'public');
            }

            return InventoryProduct::create([
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'product_image' => $imagePath,
                'product_name' => $validated['product_name'],
                'business_unit' => $validated['business_unit'],
                'product_unit' => isset($validated['product_unit']) ? (int) $validated['product_unit'] : 1,
                'product_type' => $validated['product_type'],
                'custom_product_type' => $validated['product_type'] === 'Other' ? ($validated['custom_product_type'] ?? null) : null,
                'status' => $validated['status'] ?? 'active',
                'created_by_admin_id' => $admin->id,
            ]);
        });

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'inventory_product_created',
            "Admin '{$admin->name}' created product '{$product->product_name}' (ID: {$product->id}).",
            $request
        );

        return response()->json([
            'message' => "Product '{$product->product_name}' created successfully.",
            'product' => $product->load(['category', 'brand', 'creator']),
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(int $id): JsonResponse
    {
        $product = InventoryProduct::with(['category', 'brand', 'creator'])->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['required', 'exists:inventory_categories,id'],
            'brand_id' => ['nullable', 'exists:inventory_brands,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'business_unit' => ['required', 'string', 'max:50'],
            'product_unit' => ['nullable', 'integer', 'min:1'],
            'product_type' => ['required', 'string', 'max:50'],
            'custom_product_type' => ['nullable', 'string', 'max:100', 'required_if:product_type,Other'],
            'status' => ['nullable', 'in:active,inactive'],
            'product_image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $admin = $request->user();

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

            // Note: created_by_admin_id remains preserved!
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
            'admin',
            $admin->id,
            'inventory_product_updated',
            "Admin '{$admin->name}' updated product '{$product->product_name}' (ID: {$product->id}).",
            $request
        );

        return response()->json([
            'message' => "Product '{$product->product_name}' updated successfully.",
            'product' => $product->fresh()->load(['category', 'brand', 'creator']),
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);
        $productName = $product->product_name;

        $product->delete();

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'inventory_product_deleted',
            "Admin '{$admin->name}' deleted product '{$productName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => "Product '{$productName}' deleted successfully.",
        ]);
    }
}
