<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SuperAdminCategoryController extends Controller
{
    /**
     * Display an executive listing of all categories created by admins.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('admin:id,name,email,mobile');

        // Search by category name, slug, description, or creator admin's name/email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('admin', function ($adminQuery) use ($search) {
                        $adminQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by specific admin creator
        if ($adminId = $request->input('admin_id')) {
            $query->where('admin_id', $adminId);
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
     * Display the specified category with full administrative details.
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::with('admin:id,name,email,mobile')->findOrFail($id);

        return response()->json($category);
    }

    /**
     * Delete a category (Superadmin Executive Privilege).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $categoryName = $category->name;
        $creatorName = $category->admin ? $category->admin->name : 'Unknown Admin';

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        $superAdmin = $request->user();
        AdminActivityLog::record(
            'superadmin',
            $superAdmin->id,
            'category_deleted_by_superadmin',
            "Super Admin '{$superAdmin->name}' deleted category '{$categoryName}' (ID: {$id}) created by '{$creatorName}'.",
            $request
        );

        return response()->json([
            'message' => "Category '{$categoryName}' deleted successfully by Super Admin.",
        ]);
    }

    /**
     * Executive category statistics across the entire hospital system.
     */
    public function stats(): JsonResponse
    {
        $total = Category::count();
        $active = Category::where('is_active', true)->count();
        $inactive = Category::where('is_active', false)->count();
        $creatorsCount = Category::whereNotNull('admin_id')->distinct('admin_id')->count('admin_id');

        return response()->json([
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'creators_count' => $creatorsCount,
        ]);
    }
}
