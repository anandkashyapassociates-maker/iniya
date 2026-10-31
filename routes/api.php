<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProfileController;
use App\Http\Controllers\Api\Admin\AppointmentController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\InventoryBrandController;
use App\Http\Controllers\Api\Admin\InventoryCategoryController;
use App\Http\Controllers\Api\Admin\ProductController;
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

        // Category Management (Admin Create, Edit, Update, Delete, List)
        Route::get('/categories/stats', [CategoryController::class, 'stats']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{id}', [CategoryController::class, 'show']);
        Route::match(['put', 'post'], '/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Appointment Management (Session-wise, Staff assignment, Reschedule & Cancel)
        Route::get('/appointments/stats', [AppointmentController::class, 'stats']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
        Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
        Route::post('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::post('/appointments/{id}/assign-staff', [AppointmentController::class, 'assignStaff']);
        Route::patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);

        // Appointment Dropdown Options
        Route::get('/staff-options', [AppointmentController::class, 'staffOptions']);
        Route::get('/customer-options', [AppointmentController::class, 'customerOptions']);

        // Inventory Management (Products, Categories, Brands)
        Route::prefix('inventory')->group(function () {
            // Products
            Route::get('/products', [ProductController::class, 'index']);
            Route::post('/products', [ProductController::class, 'store']);
            Route::get('/products/{id}', [ProductController::class, 'show']);
            Route::match(['put', 'post'], '/products/{id}', [ProductController::class, 'update']);
            Route::delete('/products/{id}', [ProductController::class, 'destroy']);

            // Categories
            Route::get('/categories/dropdown', [InventoryCategoryController::class, 'dropdown']);
            Route::get('/categories', [InventoryCategoryController::class, 'index']);
            Route::post('/categories', [InventoryCategoryController::class, 'store']);
            Route::get('/categories/{id}', [InventoryCategoryController::class, 'show']);
            Route::match(['put', 'post'], '/categories/{id}', [InventoryCategoryController::class, 'update']);
            Route::delete('/categories/{id}', [InventoryCategoryController::class, 'destroy']);

            // Brands
            Route::get('/brands/dropdown', [InventoryBrandController::class, 'dropdown']);
            Route::get('/brands', [InventoryBrandController::class, 'index']);
            Route::post('/brands', [InventoryBrandController::class, 'store']);
            Route::get('/brands/{id}', [InventoryBrandController::class, 'show']);
            Route::match(['put', 'post'], '/brands/{id}', [InventoryBrandController::class, 'update']);
            Route::delete('/brands/{id}', [InventoryBrandController::class, 'destroy']);
        });
    });
