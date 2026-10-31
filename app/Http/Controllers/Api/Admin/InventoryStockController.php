<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\InventoryProduct;
use App\Models\InventoryStockLog;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryStockController extends Controller
{
    /**
     * Get paginated inventory products with their current stock levels and pricing.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryProduct::with([
            'category:id,name',
            'brand:id,name',
            'vendor:id,vendor_code,vendor_name,company_name',
            'creator:id,name,email',
            'inventoryUpdater:id,name,email',
        ]);

        // Search by product name, category, or brand
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('business_unit', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('vendor', fn ($vq) => $vq->where('vendor_name', 'like', "%{$search}%")->orWhere('company_name', 'like', "%{$search}%"));
            });
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId = $request->input('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($vendorId = $request->input('vendor_id')) {
            $query->where('vendor_id', $vendorId);
        }

        // Filter by stock status
        $statusFilter = $request->input('stock_status', 'all');
        if ($statusFilter === 'low_stock') {
            $query->where(function ($q) {
                $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->where('quantity', '>', 0);
            });
        } elseif ($statusFilter === 'out_of_stock') {
            $query->where('quantity', '<=', 0);
        } elseif ($statusFilter === 'in_stock') {
            $query->whereColumn('quantity', '>', 'low_stock_threshold');
        } elseif ($statusFilter === 'all_alerts') {
            $query->where(function ($q) {
                $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                    ->orWhere('quantity', '<=', 0);
            });
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $products = $query->orderBy('quantity', 'asc')->orderBy('id', 'desc')->paginate($perPage);

        // Overall stock metrics for fast dashboard oversight
        $totalProducts = InventoryProduct::count();
        $outOfStockCount = InventoryProduct::where('quantity', '<=', 0)->count();
        $lowStockCount = InventoryProduct::whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('quantity', '>', 0)
            ->count();
        $inStockCount = InventoryProduct::whereColumn('quantity', '>', 'low_stock_threshold')->count();
        $totalAlerts = $outOfStockCount + $lowStockCount;

        return response()->json([
            'data' => $products->items(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
            'metrics' => [
                'total_products' => $totalProducts,
                'in_stock_count' => $inStockCount,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_alerts' => $totalAlerts,
            ],
        ]);
    }

    /**
     * Get only low stock and out-of-stock products for the Low Inventory page.
     */
    public function lowStock(Request $request): JsonResponse
    {
        $query = InventoryProduct::with([
            'category:id,name',
            'brand:id,name',
            'vendor:id,vendor_code,vendor_name,company_name,mobile',
            'creator:id,name,email',
            'inventoryUpdater:id,name,email',
        ])->where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', '<=', 0);
        });

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('vendor', fn ($vq) => $vq->where('vendor_name', 'like', "%{$search}%"));
            });
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $products = $query->orderBy('quantity', 'asc')->paginate($perPage);

        $outOfStockCount = InventoryProduct::where('quantity', '<=', 0)->count();
        $lowStockCount = InventoryProduct::whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('quantity', '>', 0)
            ->count();

        return response()->json([
            'data' => $products->items(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
            'metrics' => [
                'total_low_stock_alerts' => $products->total(),
                'out_of_stock_count' => $outOfStockCount,
                'low_stock_count' => $lowStockCount,
            ],
        ]);
    }

    /**
     * Add inventory stock to a product.
     */
    public function addStock(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'buy_price' => ['required', 'numeric', 'min:0'],
            'mrp' => ['required', 'numeric', 'min:0'],
            'average_price' => ['nullable', 'numeric', 'min:0'],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'business_unit' => ['nullable', 'string', 'max:50'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $quantityAdded = (int) $validated['quantity'];
        $buyPrice = (float) $validated['buy_price'];
        $mrp = (float) $validated['mrp'];

        $oldQty = (int) ($product->quantity ?? 0);
        $oldAvg = (float) ($product->average_price ?? $product->buy_price ?? 0);
        $totalQty = $oldQty + $quantityAdded;

        // Calculate weighted average price if not manually provided
        if (isset($validated['average_price']) && is_numeric($validated['average_price']) && (float) $validated['average_price'] > 0) {
            $averagePrice = (float) $validated['average_price'];
        } else {
            $averagePrice = $totalQty > 0
                ? round((($oldQty * $oldAvg) + ($quantityAdded * $buyPrice)) / $totalQty, 2)
                : $buyPrice;
        }

        $product->update([
            'quantity' => $totalQty,
            'buy_price' => $buyPrice,
            'mrp' => $mrp,
            'average_price' => $averagePrice,
            'vendor_id' => $validated['vendor_id'] ?? $product->vendor_id,
            'business_unit' => $validated['business_unit'] ?? $product->business_unit,
            'low_stock_threshold' => $validated['low_stock_threshold'] ?? $product->low_stock_threshold ?? 10,
            'inventory_updated_by' => $admin->id,
            'inventory_updated_at' => Carbon::now(),
            'is_used' => true, // Product now has active inventory
        ]);

        // Record stock entry log
        InventoryStockLog::create([
            'product_id' => $product->id,
            'vendor_id' => $validated['vendor_id'] ?? $product->vendor_id,
            'admin_id' => $admin->id,
            'quantity' => $quantityAdded,
            'business_unit' => $product->business_unit,
            'buy_price' => $buyPrice,
            'mrp' => $mrp,
            'average_price' => $averagePrice,
            'type' => 'purchase',
            'notes' => $validated['notes'] ?? null,
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'inventory_stock_added',
            "Admin '{$admin->name}' added {$quantityAdded} units of stock for product '{$product->product_name}' (Total: {$totalQty}).",
            $request
        );

        return response()->json([
            'message' => "Successfully added {$quantityAdded} units to '{$product->product_name}'.",
            'product' => $product->fresh()->load([
                'category:id,name',
                'brand:id,name',
                'vendor:id,vendor_code,vendor_name,company_name',
                'inventoryUpdater:id,name,email',
            ]),
        ]);
    }

    /**
     * Edit / update an existing inventory stock record.
     * Strictly enforces ownership: Only the admin who added the inventory can edit it.
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        $product = InventoryProduct::findOrFail($id);

        // Ownership enforcement
        if ($product->inventory_updated_by && (int) $product->inventory_updated_by !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. Only the admin who added this inventory can edit it.',
            ], 403);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'buy_price' => ['required', 'numeric', 'min:0'],
            'mrp' => ['required', 'numeric', 'min:0'],
            'average_price' => ['nullable', 'numeric', 'min:0'],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'business_unit' => ['nullable', 'string', 'max:50'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $oldQty = (int) $product->quantity;
        $newQty = (int) $validated['quantity'];
        $diff = $newQty - $oldQty;

        $averagePrice = isset($validated['average_price']) && (float) $validated['average_price'] > 0
            ? (float) $validated['average_price']
            : ($product->average_price ?? (float) $validated['buy_price']);

        $product->update([
            'quantity' => $newQty,
            'buy_price' => (float) $validated['buy_price'],
            'mrp' => (float) $validated['mrp'],
            'average_price' => $averagePrice,
            'vendor_id' => $validated['vendor_id'] ?? null,
            'business_unit' => $validated['business_unit'] ?? $product->business_unit,
            'low_stock_threshold' => $validated['low_stock_threshold'] ?? $product->low_stock_threshold ?? 10,
            'inventory_updated_by' => $admin->id,
            'inventory_updated_at' => Carbon::now(),
        ]);

        // Record adjustment log
        InventoryStockLog::create([
            'product_id' => $product->id,
            'vendor_id' => $validated['vendor_id'] ?? null,
            'admin_id' => $admin->id,
            'quantity' => $diff,
            'business_unit' => $product->business_unit,
            'buy_price' => (float) $validated['buy_price'],
            'mrp' => (float) $validated['mrp'],
            'average_price' => (float) $validated['average_price'],
            'type' => 'adjustment',
            'notes' => $validated['notes'] ?? 'Manual stock edit / adjustment',
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'inventory_stock_updated',
            "Admin '{$admin->name}' edited inventory for product '{$product->product_name}'. Set quantity to {$newQty}.",
            $request
        );

        return response()->json([
            'message' => "Inventory updated successfully for '{$product->product_name}'.",
            'product' => $product->fresh()->load([
                'category:id,name',
                'brand:id,name',
                'vendor:id,vendor_code,vendor_name,company_name',
                'inventoryUpdater:id,name,email',
            ]),
        ]);
    }

    /**
     * Get active vendors list for dropdown selection.
     */
    public function vendors(Request $request): JsonResponse
    {
        $vendors = Vendor::where('status', 'active')
            ->orderBy('vendor_name', 'asc')
            ->get(['id', 'vendor_code', 'vendor_name', 'company_name', 'mobile', 'email']);

        return response()->json([
            'data' => $vendors,
        ]);
    }

    /**
     * Get stock audit logs for a product.
     */
    public function logs(int $id): JsonResponse
    {
        $logs = InventoryStockLog::with([
            'vendor:id,vendor_name,company_name',
            'admin:id,name,email',
        ])
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $logs,
        ]);
    }

    /**
     * Summary stock metrics for dashboard and badges.
     */
    public function stats(Request $request): JsonResponse
    {
        $outOfStockCount = InventoryProduct::where('quantity', '<=', 0)->count();
        $lowStockCount = InventoryProduct::whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('quantity', '>', 0)
            ->count();

        return response()->json([
            'total_products' => InventoryProduct::count(),
            'out_of_stock_count' => $outOfStockCount,
            'low_stock_count' => $lowStockCount,
            'total_low_stock_alerts' => $outOfStockCount + $lowStockCount,
        ]);
    }
}
