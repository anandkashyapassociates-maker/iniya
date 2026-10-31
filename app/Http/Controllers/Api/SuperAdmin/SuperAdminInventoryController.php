<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $lowStockProductsCount = InventoryProduct::whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('quantity', '>', 0)
            ->count();
        $outOfStockProductsCount = InventoryProduct::where('quantity', '<=', 0)->count();

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
                'low_stock_products_count' => $lowStockProductsCount,
                'out_of_stock_products_count' => $outOfStockProductsCount,
                'total_low_stock_alerts' => $lowStockProductsCount + $outOfStockProductsCount,
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
     * Super Admin update product (Restricted - Read-only oversight).
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Editing and deleting products is restricted to creator admins.',
        ], 403);
    }

    /**
     * Toggle or update product status (Restricted - Read-only oversight).
     */
    public function updateProductStatus(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Modifying product status is restricted to creator admins.',
        ], 403);
    }

    /**
     * Delete product (Restricted - Read-only oversight).
     */
    public function destroyProduct(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Deleting products is restricted to creator admins.',
        ], 403);
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
     * Update category (Restricted - Read-only oversight).
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Editing categories is restricted to creator admins.',
        ], 403);
    }

    /**
     * Delete category (Restricted - Read-only oversight).
     */
    public function destroyCategory(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Deleting categories is restricted to creator admins.',
        ], 403);
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
     * Update brand (Restricted - Read-only oversight).
     */
    public function updateBrand(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Editing brands is restricted to creator admins.',
        ], 403);
    }

    /**
     * Delete brand (Restricted - Read-only oversight).
     */
    public function destroyBrand(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Deleting brands is restricted to creator admins.',
        ], 403);
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

    /**
     * Super Admin Read-only view of inventory stocks.
     */
    public function stocks(Request $request): JsonResponse
    {
        $query = InventoryProduct::with([
            'category:id,name',
            'brand:id,name',
            'vendor:id,vendor_code,vendor_name,company_name',
            'creator:id,name,email',
            'inventoryUpdater:id,name,email',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('business_unit', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('vendor', fn ($vq) => $vq->where('vendor_name', 'like', "%{$search}%"));
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
     * Super Admin Read-only view of low stock items.
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
     * Add stock (Super Admin restricted).
     */
    public function addStock(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Super Admin has read-only oversight for inventory stocks. Adding stock is restricted to Admins.',
        ], 403);
    }

    /**
     * Edit stock (Super Admin restricted).
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Super Admin has read-only oversight for inventory stocks. Editing stock is restricted to Admins.',
        ], 403);
    }
}
