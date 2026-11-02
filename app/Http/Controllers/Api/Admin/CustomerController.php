<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();
        $query = Customer::with('admin:id,name,email');

        // Search by name, mobile, or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by gender
        if ($gender = $request->input('gender')) {
            if (in_array($gender, ['male', 'female', 'other'], true)) {
                $query->where('gender', $gender);
            }
        }

        // Filter by active status
        if ($request->has('status') && $request->input('status') !== '' && $request->input('status') !== 'all') {
            $isActive = filter_var($request->input('status'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $customers = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'gender' => ['required', Rule::in(['male', 'female', 'other'])],
            'age' => ['required', 'integer', 'min:1', 'max:150'],
            'address' => ['required', 'string', 'max:1000'],
            'image' => ['nullable'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $admin = $request->user();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:5120'],
            ], [
                'image.file' => 'The customer photo must be a valid image file.',
                'image.mimes' => 'The customer photo must be a file of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The customer photo size cannot exceed 5MB.',
            ]);
            $imagePath = $request->file('image')->store('customers', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'customers/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $imagePath = $fileName;
                }
            }
        }

        $customer = Customer::create([
            'admin_id' => $admin->id,
            'name' => $validated['name'],
            'mobile' => $validated['mobile'],
            'email' => $validated['email'] ?? null,
            'gender' => $validated['gender'],
            'age' => $validated['age'],
            'address' => $validated['address'],
            'image' => $imagePath,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AdminActivityLog::record(
            'admin',
            $admin->id,
            'customer_created',
            "Admin '{$admin->name}' created customer '{$customer->name}' (ID: {$customer->id}).",
            $request
        );

        return response()->json([
            'message' => 'Customer created successfully.',
            'customer' => $customer->load('admin:id,name,email'),
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(int $id): JsonResponse
    {
        $customer = Customer::with('admin:id,name,email')->findOrFail($id);

        return response()->json($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        if ($customer->admin_id && (int) $customer->admin_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only edit customers registered by you.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'gender' => ['required', Rule::in(['male', 'female', 'other'])],
            'age' => ['required', 'integer', 'min:1', 'max:150'],
            'address' => ['required', 'string', 'max:1000'],
            'image' => ['nullable'],
            'remove_image' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $imagePath = $customer->image;

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'mimes:jpeg,png,jpg,webp,gif,bmp,svg', 'max:5120'],
            ], [
                'image.file' => 'The customer photo must be a valid image file.',
                'image.mimes' => 'The customer photo must be a file of type: jpeg, png, jpg, webp, gif, bmp, svg.',
                'image.max' => 'The customer photo size cannot exceed 5MB.',
            ]);
            // Delete old file if present
            if ($customer->image && Storage::disk('public')->exists($customer->image)) {
                Storage::disk('public')->delete($customer->image);
            }
            $imagePath = $request->file('image')->store('customers', 'public');
        } elseif ($request->filled('image') && is_string($request->input('image')) && str_starts_with($request->input('image'), 'data:image')) {
            if ($customer->image && Storage::disk('public')->exists($customer->image)) {
                Storage::disk('public')->delete($customer->image);
            }
            $dataUri = $request->input('image');
            if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $type)) {
                $data = substr($dataUri, strpos($dataUri, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $fileName = 'customers/'.Str::random(40).'.'.$type;
                    Storage::disk('public')->put($fileName, $data);
                    $imagePath = $fileName;
                }
            }
        } elseif ($request->boolean('remove_image')) {
            if ($customer->image && Storage::disk('public')->exists($customer->image)) {
                Storage::disk('public')->delete($customer->image);
            }
            $imagePath = null;
        }

        $customer->update([
            'name' => $validated['name'],
            'mobile' => $validated['mobile'],
            'email' => $validated['email'] ?? null,
            'gender' => $validated['gender'],
            'age' => $validated['age'],
            'address' => $validated['address'],
            'image' => $imagePath,
            'is_active' => $validated['is_active'] ?? $customer->is_active,
        ]);

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'customer_updated',
            "Admin '{$admin->name}' updated customer '{$customer->name}' (ID: {$customer->id}).",
            $request
        );

        return response()->json([
            'message' => 'Customer updated successfully.',
            'customer' => $customer->load('admin:id,name,email'),
        ]);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        if ($customer->admin_id && (int) $customer->admin_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only delete customers registered by you.',
            ], 403);
        }

        $customerName = $customer->name;

        if ($customer->image && Storage::disk('public')->exists($customer->image)) {
            Storage::disk('public')->delete($customer->image);
        }

        $customer->delete();

        $admin = $request->user();
        AdminActivityLog::record(
            'admin',
            $admin->id,
            'customer_deleted',
            "Admin '{$admin->name}' deleted customer '{$customerName}' (ID: {$id}).",
            $request
        );

        return response()->json([
            'message' => 'Customer deleted successfully.',
        ]);
    }

    /**
     * Quick statistics for customers.
     */
    public function stats(): JsonResponse
    {
        $total = Customer::count();
        $active = Customer::where('is_active', true)->count();
        $inactive = Customer::where('is_active', false)->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
        ]);
    }
}
