<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use App\Models\InventoryProduct;
use App\Models\SalesMember;
use App\Models\Staff;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics and recent records for Super Admin.
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Admin Management Metrics
        $totalAdmins = Admin::count();
        $activeAdmins = Admin::where('status', Admin::STATUS_ACTIVE)
            ->orWhere(function ($q) {
                $q->whereNull('status')->where('is_active', true);
            })->count();
        $blockedAdmins = Admin::where('status', Admin::STATUS_BLOCKED)->count();
        $inactiveAdmins = Admin::where('status', Admin::STATUS_INACTIVE)
            ->orWhere(function ($q) {
                $q->whereNull('status')->where('is_active', false);
            })->count();

        // 2. Staff Management Metrics
        $totalStaff = Staff::count();
        $activeStaff = Staff::where('status', Staff::STATUS_ACTIVE)->count();
        $inactiveStaff = Staff::where('status', Staff::STATUS_INACTIVE)->count();
        $blockedStaff = Staff::where('status', Staff::STATUS_BLOCKED)->count();
        $staffDepartmentsCount = Staff::whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct('department')
            ->count('department');

        // 3. Vendor Management Metrics
        $totalVendors = Vendor::count();
        $activeVendors = Vendor::where('status', Vendor::STATUS_ACTIVE)->count();
        $inactiveVendors = Vendor::where('status', Vendor::STATUS_INACTIVE)->count();
        $blockedVendors = Vendor::where('status', Vendor::STATUS_BLOCKED)->count();
        $vendorTypesCount = Vendor::whereNotNull('vendor_type')
            ->where('vendor_type', '!=', '')
            ->distinct('vendor_type')
            ->count('vendor_type');

        // 4. Sales Team Management Metrics
        $totalSales = SalesMember::count();
        $activeSales = SalesMember::where('status', SalesMember::STATUS_ACTIVE)->count();
        $inactiveSales = SalesMember::where('status', SalesMember::STATUS_INACTIVE)->count();
        $blockedSales = SalesMember::where('status', SalesMember::STATUS_BLOCKED)->count();
        $salesTerritoriesCount = SalesMember::whereNotNull('territory')
            ->where('territory', '!=', '')
            ->distinct('territory')
            ->count('territory');

        // High-level executive KPI aggregations
        $totalPersonnel = $totalAdmins + $totalStaff + $totalVendors + $totalSales;
        $totalActive = $activeAdmins + $activeStaff + $activeVendors + $activeSales;
        $totalInactive = $inactiveAdmins + $inactiveStaff + $inactiveVendors + $inactiveSales;
        $totalBlocked = $blockedAdmins + $blockedStaff + $blockedVendors + $blockedSales;
        $activeRate = $totalPersonnel > 0 ? round(($totalActive / $totalPersonnel) * 100, 1) : 100.0;

        $lowStockProductsCount = InventoryProduct::where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', '<=', 0);
        })->count();
        $totalInventoryProducts = InventoryProduct::count();

        // Recent Records from Each Module (Compact)
        $recentAdmins = Admin::latest()
            ->take(4)
            ->get(['id', 'name', 'email', 'status', 'is_active', 'created_at']);

        $recentStaff = Staff::latest()
            ->take(4)
            ->get(['id', 'staff_code', 'name', 'email', 'department', 'designation', 'status', 'created_at']);

        $recentVendors = Vendor::latest()
            ->take(4)
            ->get(['id', 'vendor_code', 'vendor_name', 'company_name', 'email', 'vendor_type', 'status', 'created_at']);

        $recentSales = SalesMember::latest()
            ->take(4)
            ->get(['id', 'sales_code', 'name', 'email', 'territory', 'designation', 'status', 'created_at']);

        // Recent System Activities Log (Filtered & Compact)
        $recentActivity = AdminActivityLog::latest()
            ->take(4)
            ->get([
                'id',
                'actor_type',
                'actor_id',
                'action',
                'description',
                'ip_address',
                'created_at',
            ]);

        return response()->json([
            'summary' => [
                'total_personnel' => $totalPersonnel,
                'total_active' => $totalActive,
                'total_inactive' => $totalInactive,
                'total_blocked' => $totalBlocked,
                'active_rate' => $activeRate,
                'low_stock_products_count' => $lowStockProductsCount,
                'total_inventory_products' => $totalInventoryProducts,
            ],
            'modules' => [
                'admins' => [
                    'label' => 'Admin Management',
                    'total' => $totalAdmins,
                    'active' => $activeAdmins,
                    'inactive' => $inactiveAdmins,
                    'blocked' => $blockedAdmins,
                    'active_rate' => $totalAdmins > 0 ? round(($activeAdmins / $totalAdmins) * 100, 1) : 100,
                    'details_url' => '/superadmin/admin-management/details',
                    'create_url' => '/superadmin/admin-management/create',
                    'recent' => $recentAdmins,
                ],
                'staff' => [
                    'label' => 'Staff Management',
                    'total' => $totalStaff,
                    'active' => $activeStaff,
                    'inactive' => $inactiveStaff,
                    'blocked' => $blockedStaff,
                    'departments_count' => $staffDepartmentsCount,
                    'active_rate' => $totalStaff > 0 ? round(($activeStaff / $totalStaff) * 100, 1) : 100,
                    'details_url' => '/superadmin/staff-management/details',
                    'create_url' => '/superadmin/staff-management/create',
                    'recent' => $recentStaff,
                ],
                'vendors' => [
                    'label' => 'Vendor Management',
                    'total' => $totalVendors,
                    'active' => $activeVendors,
                    'inactive' => $inactiveVendors,
                    'blocked' => $blockedVendors,
                    'types_count' => $vendorTypesCount,
                    'active_rate' => $totalVendors > 0 ? round(($activeVendors / $totalVendors) * 100, 1) : 100,
                    'details_url' => '/superadmin/vendors',
                    'create_url' => '/superadmin/vendors/create',
                    'recent' => $recentVendors,
                ],
                'sales_team' => [
                    'label' => 'Sales Team Management',
                    'total' => $totalSales,
                    'active' => $activeSales,
                    'inactive' => $inactiveSales,
                    'blocked' => $blockedSales,
                    'territories_count' => $salesTerritoriesCount,
                    'active_rate' => $totalSales > 0 ? round(($activeSales / $totalSales) * 100, 1) : 100,
                    'details_url' => '/superadmin/sales-members',
                    'create_url' => '/superadmin/sales-members/create',
                    'recent' => $recentSales,
                ],
            ],
            // Backward compatibility
            'stats' => [
                'total_admins' => $totalAdmins,
                'active_admins' => $activeAdmins,
                'inactive_admins' => $inactiveAdmins,
            ],
            'recent_admins' => $recentAdmins,
            'recent_activity' => $recentActivity,
        ]);
    }
}
