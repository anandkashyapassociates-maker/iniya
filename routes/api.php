<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProfileController;
use App\Http\Controllers\Api\Admin\AppointmentSessionController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\MasterAppointmentController;
use App\Http\Controllers\Api\Admin\ServiceManagementController;
use App\Http\Controllers\Api\Admin\SessionRescheduleController;
use App\Http\Controllers\Api\SuperAdmin\AdminManagementController;
use App\Http\Controllers\Api\SuperAdmin\SalesMemberManagementController;
use App\Http\Controllers\Api\SuperAdmin\StaffManagementController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminCategoryController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminDashboardController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminInventoryController;
use App\Http\Controllers\Api\SuperAdmin\VendorManagementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Existing General API Routes (Preserved)
|--------------------------------------------------------------------------
*/
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Super Admin Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('superadmin')->group(function () {
    Route::post('/login', [SuperAdminAuthController::class, 'login'])
        ->middleware('throttle:15,1');

    Route::post('/forgot-password', [SuperAdminAuthController::class, 'forgotPassword'])
        ->middleware('throttle:15,1');

    Route::post('/reset-password', [SuperAdminAuthController::class, 'resetPassword'])
        ->middleware('throttle:15,1');
});

/*
|--------------------------------------------------------------------------
| Super Admin Protected Routes (Guarded & Authorized)
|--------------------------------------------------------------------------
*/
Route::prefix('superadmin')
    ->middleware(['auth:sanctum', 'auth.superadmin'])
    ->group(function () {
        Route::get('/me', [SuperAdminAuthController::class, 'me']);
        Route::post('/logout', [SuperAdminAuthController::class, 'logout']);
        Route::put('/profile', [SuperAdminAuthController::class, 'updateProfile']);
        Route::post('/change-password', [SuperAdminAuthController::class, 'changePassword']);

        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index']);

        // Admin Account Management
        Route::get('/admins', [AdminManagementController::class, 'index']);
        Route::post('/admins', [AdminManagementController::class, 'store']);
        Route::get('/admins/{id}', [AdminManagementController::class, 'show']);
        Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
        Route::patch('/admins/{id}/status', [AdminManagementController::class, 'updateStatus']);
        Route::post('/admins/{id}/password-reset', [AdminManagementController::class, 'resetPassword']);
        Route::post('/admins/{id}/impersonate', [AdminManagementController::class, 'impersonate']);

        // Staff Management
        Route::get('/staff/preview-code', [StaffManagementController::class, 'previewCode']);
        Route::get('/staff/departments', [StaffManagementController::class, 'departments']);
        Route::get('/staff', [StaffManagementController::class, 'index']);
        Route::post('/staff', [StaffManagementController::class, 'store']);
        Route::get('/staff/{id}', [StaffManagementController::class, 'show']);
        Route::put('/staff/{id}', [StaffManagementController::class, 'update']);
        Route::patch('/staff/{id}/status', [StaffManagementController::class, 'updateStatus']);

        // Vendor Management
        Route::get('/vendors/preview-code', [VendorManagementController::class, 'previewCode']);
        Route::get('/vendors/types', [VendorManagementController::class, 'types']);
        Route::get('/vendors', [VendorManagementController::class, 'index']);
        Route::post('/vendors', [VendorManagementController::class, 'store']);
        Route::get('/vendors/{id}', [VendorManagementController::class, 'show']);
        Route::put('/vendors/{id}', [VendorManagementController::class, 'update']);
        Route::patch('/vendors/{id}/status', [VendorManagementController::class, 'updateStatus']);

        // Sales Team Management
        Route::get('/sales-members/preview-code', [SalesMemberManagementController::class, 'previewCode']);
        Route::get('/sales-members/departments', [SalesMemberManagementController::class, 'departments']);
        Route::get('/sales-members/territories', [SalesMemberManagementController::class, 'territories']);
        Route::get('/sales-members', [SalesMemberManagementController::class, 'index']);
        Route::post('/sales-members', [SalesMemberManagementController::class, 'store']);
        Route::get('/sales-members/{id}', [SalesMemberManagementController::class, 'show']);
        Route::put('/sales-members/{id}', [SalesMemberManagementController::class, 'update']);
        Route::patch('/sales-members/{id}/status', [SalesMemberManagementController::class, 'updateStatus']);

        // Category Oversight (SuperAdmin View and Delete Power)
        Route::get('/categories/stats', [SuperAdminCategoryController::class, 'stats']);
        Route::get('/categories', [SuperAdminCategoryController::class, 'index']);
        Route::get('/categories/{id}', [SuperAdminCategoryController::class, 'show']);
        Route::delete('/categories/{id}', [SuperAdminCategoryController::class, 'destroy']);

        // Inventory Management (SuperAdmin Reporting, Products, Categories, Brands)
        Route::prefix('inventory')->group(function () {
            Route::get('/overview', [SuperAdminInventoryController::class, 'overview']);
            Route::get('/stocks', [SuperAdminInventoryController::class, 'stocks']);
            Route::get('/stocks/low-stock', [SuperAdminInventoryController::class, 'lowStock']);
            Route::post('/stocks/{id}/add', [SuperAdminInventoryController::class, 'addStock']);
            Route::match(['put', 'post'], '/stocks/{id}', [SuperAdminInventoryController::class, 'updateStock']);
            Route::get('/products', [SuperAdminInventoryController::class, 'products']);
            Route::get('/products/{id}', [SuperAdminInventoryController::class, 'showProduct']);
            Route::match(['put', 'post'], '/products/{id}', [SuperAdminInventoryController::class, 'updateProduct']);
            Route::delete('/products/{id}', [SuperAdminInventoryController::class, 'destroyProduct']);
            Route::patch('/products/{id}/status', [SuperAdminInventoryController::class, 'updateProductStatus']);

            Route::get('/categories', [SuperAdminInventoryController::class, 'categories']);
            Route::match(['put', 'post'], '/categories/{id}', [SuperAdminInventoryController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [SuperAdminInventoryController::class, 'destroyCategory']);

            Route::get('/brands', [SuperAdminInventoryController::class, 'brands']);
            Route::match(['put', 'post'], '/brands/{id}', [SuperAdminInventoryController::class, 'updateBrand']);
            Route::delete('/brands/{id}', [SuperAdminInventoryController::class, 'destroyBrand']);

            Route::get('/admin-report', [SuperAdminInventoryController::class, 'adminReport']);
        });
    });

/*
|--------------------------------------------------------------------------
| Admin Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->middleware('throttle:15,1');

    Route::post('/forgot-password', [AdminAuthController::class, 'forgotPassword'])
        ->middleware('throttle:15,1');

    Route::post('/reset-password', [AdminAuthController::class, 'resetPassword'])
        ->middleware('throttle:15,1');
});

/*
|--------------------------------------------------------------------------
| Admin Protected Routes (Guarded & Authorized)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'auth.admin'])
    ->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::put('/profile', [AdminProfileController::class, 'update']);
        Route::post('/change-password', [AdminProfileController::class, 'changePassword']);

        // Customer Management
        Route::get('/customers/stats', [CustomerController::class, 'stats']);
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::match(['put', 'post'], '/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

        // ==========================================
        // MASTER APPOINTMENT & MULTIPLE SESSIONS SYSTEM
        // ==========================================
        Route::get('/master-appointments/stats', [MasterAppointmentController::class, 'stats']);
        Route::get('/master-appointments/options', [MasterAppointmentController::class, 'options']);
        Route::get('/master-appointments', [MasterAppointmentController::class, 'index']);
        Route::post('/master-appointments', [MasterAppointmentController::class, 'store']);
        Route::get('/master-appointments/{id}', [MasterAppointmentController::class, 'show']);
        Route::put('/master-appointments/{id}', [MasterAppointmentController::class, 'update']);
        Route::delete('/master-appointments/{id}', [MasterAppointmentController::class, 'destroy']);

        // Individual Session Management
        Route::post('/master-appointments/{id}/sessions', [AppointmentSessionController::class, 'store']);
        Route::put('/sessions/{id}', [AppointmentSessionController::class, 'update']);
        Route::patch('/sessions/{id}/status', [AppointmentSessionController::class, 'updateStatus']);
        Route::delete('/sessions/{id}', [AppointmentSessionController::class, 'destroy']);
        Route::get('/calendar/sessions', [AppointmentSessionController::class, 'calendar']);

        // Session Reschedule & History (Strict Pending Validation & Concurrency Locked)
        Route::post('/sessions/{id}/reschedule', [SessionRescheduleController::class, 'reschedule']);
        Route::get('/sessions/{id}/reschedule-history', [SessionRescheduleController::class, 'history']);

        // ==========================================
        // CATEGORY, SUB-CATEGORY & SERVICE MANAGEMENT
        // ==========================================
        Route::prefix('services-management')->group(function () {
            Route::get('/tree', [ServiceManagementController::class, 'getTree']);

            // Categories
            Route::get('/categories', [ServiceManagementController::class, 'getCategories']);
            Route::post('/categories', [ServiceManagementController::class, 'storeCategory']);
            Route::put('/categories/{id}', [ServiceManagementController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [ServiceManagementController::class, 'deleteCategory']);

            // Sub-Categories
            Route::get('/sub-categories', [ServiceManagementController::class, 'getSubCategories']);
            Route::post('/sub-categories', [ServiceManagementController::class, 'storeSubCategory']);
            Route::put('/sub-categories/{id}', [ServiceManagementController::class, 'updateSubCategory']);
            Route::delete('/sub-categories/{id}', [ServiceManagementController::class, 'deleteSubCategory']);

            // Services
            Route::get('/services', [ServiceManagementController::class, 'getServices']);
            Route::post('/services', [ServiceManagementController::class, 'storeService']);
            Route::put('/services/{id}', [ServiceManagementController::class, 'updateService']);
            Route::delete('/services/{id}', [ServiceManagementController::class, 'deleteService']);
        });
    });
