<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSession;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceManagementController extends Controller
{
    /**
     * Get complete hierarchy tree (Categories -> Sub-Categories -> Services).
     */
    public function getTree(Request $request): JsonResponse
    {
        $status = $request->query('status'); // optional filter: 'active'

        $categoriesQuery = ServiceCategory::categories()
            ->with([
                'children' => function ($q) use ($status) {
                    if ($status) {
                        $q->where('status', $status);
                    }
                    $q->orderBy('name')->with([
                        'services' => function ($sq) use ($status) {
                            if ($status) {
                                $sq->where('status', $status);
                            }
                            $sq->orderBy('name');
                        },
                    ]);
                },
            ])
            ->orderBy('name');

        if ($status) {
            $categoriesQuery->where('status', $status);
        }

        $tree = $categoriesQuery->get();

        return response()->json([
            'success' => true,
            'data' => $tree,
        ]);
    }

    /**
     * List main Categories.
     */
    public function getCategories(Request $request): JsonResponse
    {
        $query = ServiceCategory::categories()
            ->withCount('children')
            ->orderBy('name');

        if ($search = trim((string) $request->input('search'))) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a new main Category.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $category = ServiceCategory::create([
            'parent_id' => null,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'type' => 'category',
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data' => $category->loadCount('children'),
        ], 201);
    }

    /**
     * Update an existing main Category.
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = ServiceCategory::categories()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $category->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category->fresh()->loadCount('children'),
        ]);
    }

    /**
     * Delete a main Category with business rule check.
     * Restriction: Do not allow deletion if it contains Sub-Categories.
     */
    public function deleteCategory(int $id): JsonResponse
    {
        $category = ServiceCategory::categories()->findOrFail($id);

        $subCategoryCount = $category->children()->count();
        if ($subCategoryCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete Category '{$category->name}' because it contains {$subCategoryCount} Sub-Category(ies). Please delete or reassign them first.",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    /**
     * List Sub-Categories.
     */
    public function getSubCategories(Request $request): JsonResponse
    {
        $query = ServiceCategory::subCategories()
            ->with(['parent:id,name'])
            ->withCount('services')
            ->orderBy('name');

        if ($parentId = $request->input('parent_id')) {
            $query->where('parent_id', $parentId);
        }

        if ($search = trim((string) $request->input('search'))) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $subCategories = $query->get();

        return response()->json([
            'success' => true,
            'data' => $subCategories,
        ]);
    }

    /**
     * Store a new Sub-Category.
     */
    public function storeSubCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => [
                'required',
                Rule::exists('service_categories', 'id')->where(function ($q) {
                    $q->where('type', 'category')->whereNull('parent_id');
                }),
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $subCategory = ServiceCategory::create([
            'parent_id' => $validated['parent_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'type' => 'sub_category',
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sub-Category created successfully.',
            'data' => $subCategory->load(['parent:id,name'])->loadCount('services'),
        ], 201);
    }

    /**
     * Update an existing Sub-Category.
     */
    public function updateSubCategory(Request $request, int $id): JsonResponse
    {
        $subCategory = ServiceCategory::subCategories()->findOrFail($id);

        $validated = $request->validate([
            'parent_id' => [
                'required',
                Rule::exists('service_categories', 'id')->where(function ($q) {
                    $q->where('type', 'category')->whereNull('parent_id');
                }),
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $subCategory->update([
            'parent_id' => $validated['parent_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sub-Category updated successfully.',
            'data' => $subCategory->fresh(['parent:id,name'])->loadCount('services'),
        ]);
    }

    /**
     * Delete a Sub-Category with business rule check.
     * Restriction: Do not allow deletion if it contains Services.
     */
    public function deleteSubCategory(int $id): JsonResponse
    {
        $subCategory = ServiceCategory::subCategories()->findOrFail($id);

        $serviceCount = $subCategory->services()->count();
        if ($serviceCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete Sub-Category '{$subCategory->name}' because it contains {$serviceCount} Service(s). Please delete or reassign them first.",
            ], 422);
        }

        $subCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub-Category deleted successfully.',
        ]);
    }

    /**
     * List Services.
     */
    public function getServices(Request $request): JsonResponse
    {
        $query = Service::with([
            'category:id,parent_id,name,type',
            'category.parent:id,name',
        ])->orderBy('name');

        if ($subCategoryId = $request->input('service_category_id')) {
            $query->where('service_category_id', $subCategoryId);
        }

        if ($search = trim((string) $request->input('search'))) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $services = $query->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Store a new Service.
     */
    public function storeService(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_category_id' => [
                'required',
                Rule::exists('service_categories', 'id')->where(function ($q) {
                    $q->where('type', 'sub_category')->whereNotNull('parent_id');
                }),
            ],
            'name' => ['required', 'string', 'max:150'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $service = Service::create([
            'service_category_id' => $validated['service_category_id'],
            'name' => $validated['name'],
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully.',
            'data' => $service->load(['category.parent']),
        ], 201);
    }

    /**
     * Update an existing Service.
     */
    public function updateService(Request $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'service_category_id' => [
                'required',
                Rule::exists('service_categories', 'id')->where(function ($q) {
                    $q->where('type', 'sub_category')->whereNotNull('parent_id');
                }),
            ],
            'name' => ['required', 'string', 'max:150'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $service->update([
            'service_category_id' => $validated['service_category_id'],
            'name' => $validated['name'],
            'price' => $validated['price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'data' => $service->fresh(['category.parent']),
        ]);
    }

    /**
     * Delete a Service with business rule check.
     * Restriction: Do not allow deletion if already linked to Appointment Sessions.
     */
    public function deleteService(int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $sessionCount = AppointmentSession::where('service_id', $service->id)->count();
        if ($sessionCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete Service '{$service->name}' because it is linked to {$sessionCount} active or historical Appointment Session(s).",
            ], 422);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.',
        ]);
    }
}
