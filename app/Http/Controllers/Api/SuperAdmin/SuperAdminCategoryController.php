<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     * Delete a category (Restricted - Read-only oversight).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthorized. Super Admin has read-only oversight. Deleting categories is restricted to creator admins.',
        ], 403);
    }

    /**
     * Executive category statistics across the entire clinic system.
     */
    public function stats(): JsonResponse
    {
        $total = Category::count();
        $creatorsCount = Category::whereNotNull('admin_id')->distinct('admin_id')->count('admin_id');

        return response()->json([
            'total' => $total,
            'creators_count' => $creatorsCount,
        ]);
    }
}
