<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProfileController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\SuperAdmin\AdminManagementController;
use App\Http\Controllers\Api\SuperAdmin\StaffManagementController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\Api\SuperAdmin\SuperAdminDashboardController;
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

        // Staff Management
        Route::get('/staff/preview-code', [StaffManagementController::class, 'previewCode']);
        Route::get('/staff/departments', [StaffManagementController::class, 'departments']);
        Route::get('/staff', [StaffManagementController::class, 'index']);
        Route::post('/staff', [StaffManagementController::class, 'store']);
        Route::get('/staff/{id}', [StaffManagementController::class, 'show']);
        Route::put('/staff/{id}', [StaffManagementController::class, 'update']);
        Route::patch('/staff/{id}/status', [StaffManagementController::class, 'updateStatus']);
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
    });
