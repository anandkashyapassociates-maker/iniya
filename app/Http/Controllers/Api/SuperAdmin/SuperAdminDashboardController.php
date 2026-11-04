<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminActivityLog;
use App\Models\AppointmentSession;
use App\Models\Customer;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use App\Models\InventoryStockLog;
use App\Models\MasterAppointment;
use App\Models\Payout;
use App\Models\SalesMember;
use App\Models\Service;
use App\Models\Staff;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics and recent records for Super Admin,
     * fully mirroring all sidebar modules with 100% real database data.
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

        // High-level workforce aggregations
        $totalPersonnel = $totalAdmins + $totalStaff + $totalVendors + $totalSales;
        $totalActive = $activeAdmins + $activeStaff + $activeVendors + $activeSales;
        $totalInactive = $inactiveAdmins + $inactiveStaff + $inactiveVendors + $inactiveSales;
        $totalBlocked = $blockedAdmins + $blockedStaff + $blockedVendors + $blockedSales;
        $activeRate = $totalPersonnel > 0 ? round(($totalActive / $totalPersonnel) * 100, 1) : 100.0;

        // 5. Inventory Management Metrics
        $totalInventoryProducts = InventoryProduct::count();
        $totalInventoryUnits = (int) InventoryProduct::sum('quantity');
        $totalInventoryValuation = (float) (InventoryProduct::selectRaw('SUM(quantity * buy_price) as total_val')->value('total_val') ?? 0);
        $lowStockProductsCount = InventoryProduct::where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', '<=', 0);
        })->count();
        $totalCategories = InventoryCategory::count();
        $totalBrands = InventoryBrand::count();
        $totalStockLogs = InventoryStockLog::count();

        // 6. Clinical Appointments & OPD Metrics (Reports & Analytics)
        $totalCustomers = Customer::count();
        $totalMasterAppointments = MasterAppointment::count();
        $totalAppointmentSessions = AppointmentSession::count();
        $totalServices = Service::count();

        $sessionsPending = AppointmentSession::where('status', AppointmentSession::STATUS_PENDING)->count();
        $sessionsInProgress = AppointmentSession::where('status', AppointmentSession::STATUS_IN_PROGRESS)->count();
        $sessionsCompleted = AppointmentSession::where('status', AppointmentSession::STATUS_COMPLETED)->count();
        $sessionsCancelled = AppointmentSession::where('status', AppointmentSession::STATUS_CANCELLED)->count();

        // 7. Payout Management Metrics
        $totalPayouts = Payout::count();
        $staffPayoutsCount = Payout::where('payout_type', Payout::TYPE_STAFF)->count();
        $staffPayoutsDisbursed = (float) (Payout::where('payout_type', Payout::TYPE_STAFF)->where('status', Payout::STATUS_COMPLETED)->sum('paid_amount') ?? 0);
        $vendorPayoutsCount = Payout::where('payout_type', Payout::TYPE_VENDOR)->count();
        $vendorPayoutsDisbursed = (float) (Payout::where('payout_type', Payout::TYPE_VENDOR)->where('status', Payout::STATUS_COMPLETED)->sum('paid_amount') ?? 0);
        $totalDisbursed = $staffPayoutsDisbursed + $vendorPayoutsDisbursed;
        $pendingPayoutLiabilities = (float) (Payout::whereIn('status', [Payout::STATUS_PENDING, Payout::STATUS_PARTIAL])->sum('balance_amount') ?? 0);

        // 8. Recent Records for Each Module (Real DB Data)
        $recentAdmins = Admin::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'status', 'is_active', 'created_at']);

        $recentStaff = Staff::latest()
            ->take(5)
            ->get(['id', 'staff_code', 'name', 'email', 'department', 'designation', 'status', 'created_at']);

        $recentVendors = Vendor::latest()
            ->take(5)
            ->get(['id', 'vendor_code', 'vendor_name', 'company_name', 'email', 'vendor_type', 'status', 'created_at']);

        $recentSales = SalesMember::latest()
            ->take(5)
            ->get(['id', 'sales_code', 'name', 'email', 'territory', 'designation', 'status', 'created_at']);

        $recentAppointments = MasterAppointment::with([
            'customer:id,first_name,last_name,email,mobile_number',
            'sessions:id,master_appointment_id,status,session_date,session_time',
        ])
            ->latest()
            ->take(5)
            ->get(['id', 'appointment_number', 'customer_id', 'appointment_date', 'appointment_fees', 'created_at']);

        $lowStockProducts = InventoryProduct::where(function ($q) {
            $q->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orWhere('quantity', '<=', 0);
        })
            ->with(['category:id,name', 'brand:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'product_name', 'category_id', 'brand_id', 'quantity', 'low_stock_threshold', 'buy_price', 'status']);

        $recentPayouts = Payout::with([
            'staff:id,name,staff_code',
            'vendor:id,vendor_name,company_name',
        ])
            ->latest()
            ->take(5)
            ->get(['id', 'payout_number', 'payout_type', 'staff_id', 'vendor_id', 'paid_amount', 'total_amount', 'balance_amount', 'status', 'payout_date']);

        $recentActivity = AdminActivityLog::latest()
            ->take(8)
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
                'total_inventory_products' => $totalInventoryProducts,
                'total_inventory_units' => $totalInventoryUnits,
                'total_inventory_valuation' => $totalInventoryValuation,
                'low_stock_products_count' => $lowStockProductsCount,
                'total_customers' => $totalCustomers,
                'total_master_appointments' => $totalMasterAppointments,
                'total_appointment_sessions' => $totalAppointmentSessions,
                'total_services' => $totalServices,
                'total_payouts' => $totalPayouts,
                'total_disbursed' => $totalDisbursed,
                'pending_payout_liabilities' => $pendingPayoutLiabilities,
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
                'inventory' => [
                    'label' => 'Inventory Management',
                    'total_products' => $totalInventoryProducts,
                    'total_units' => $totalInventoryUnits,
                    'total_valuation' => $totalInventoryValuation,
                    'low_stock_count' => $lowStockProductsCount,
                    'categories_count' => $totalCategories,
                    'brands_count' => $totalBrands,
                    'stock_logs_count' => $totalStockLogs,
                    'overview_url' => '/superadmin/inventory/overview',
                    'products_url' => '/superadmin/inventory/products',
                    'stocks_url' => '/superadmin/inventory/stocks',
                    'low_stock_items' => $lowStockProducts,
                ],
                'clinical' => [
                    'label' => 'Appointments & Clinical Reports',
                    'total_customers' => $totalCustomers,
                    'total_master_appointments' => $totalMasterAppointments,
                    'total_sessions' => $totalAppointmentSessions,
                    'total_services' => $totalServices,
                    'sessions_pending' => $sessionsPending,
                    'sessions_in_progress' => $sessionsInProgress,
                    'sessions_completed' => $sessionsCompleted,
                    'sessions_cancelled' => $sessionsCancelled,
                    'appointment_reports_url' => '/superadmin/reports/appointments',
                    'session_reports_url' => '/superadmin/reports/sessions',
                    'recent_appointments' => $recentAppointments,
                ],
                'payouts' => [
                    'label' => 'Payout Management',
                    'total_payouts' => $totalPayouts,
                    'staff_disbursed' => $staffPayoutsDisbursed,
                    'staff_count' => $staffPayoutsCount,
                    'vendor_disbursed' => $vendorPayoutsDisbursed,
                    'vendor_count' => $vendorPayoutsCount,
                    'total_disbursed' => $totalDisbursed,
                    'pending_liabilities' => $pendingPayoutLiabilities,
                    'staff_payouts_url' => '/superadmin/payouts/staff',
                    'vendor_payouts_url' => '/superadmin/payouts/vendors',
                    'ledger_url' => '/superadmin/payouts/ledger',
                    'recent_payouts' => $recentPayouts,
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
