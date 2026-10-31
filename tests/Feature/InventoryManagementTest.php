<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;

    protected SuperAdmin $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Chief Executive',
            'email' => 'superadmin_'.uniqid().'@iniya.local',
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        $this->admin = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Dr. Sharma Admin',
            'email' => 'admin_'.uniqid().'@iniya.local',
            'password' => Hash::make('AdminPass123!'),
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_inventory_apis(): void
    {
        $this->getJson('/api/admin/inventory/products')->assertStatus(401);
        $this->getJson('/api/admin/inventory/categories')->assertStatus(401);
        $this->getJson('/api/admin/inventory/brands')->assertStatus(401);
        $this->getJson('/api/superadmin/inventory/overview')->assertStatus(401);
    }

    public function test_admin_can_create_category_and_brand(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        // Create Category
        $catRes = $this->postJson('/api/admin/inventory/categories', [
            'name' => 'Surgical Supplies',
            'description' => 'Medical grade surgical items and disposable tools',
            'status' => 'active',
        ]);
        $catRes->assertStatus(201)
            ->assertJsonPath('category.name', 'Surgical Supplies')
            ->assertJsonPath('category.slug', 'surgical-supplies');

        $this->assertDatabaseHas('inventory_categories', [
            'name' => 'Surgical Supplies',
            'slug' => 'surgical-supplies',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        // Create Brand
        $brandRes = $this->postJson('/api/admin/inventory/brands', [
            'name' => 'Medtronic Health',
            'description' => 'Precision clinical and surgical devices',
            'status' => 'active',
        ]);
        $brandRes->assertStatus(201)
            ->assertJsonPath('brand.name', 'Medtronic Health')
            ->assertJsonPath('brand.slug', 'medtronic-health');

        $this->assertDatabaseHas('inventory_brands', [
            'name' => 'Medtronic Health',
            'slug' => 'medtronic-health',
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_create_product_with_image_and_custom_type(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $category = InventoryCategory::create([
            'name' => 'Medical Devices',
            'slug' => 'medical-devices',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $brand = InventoryBrand::create([
            'name' => 'Philips Healthcare',
            'slug' => 'philips-healthcare',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $image = UploadedFile::fake()->image('pulse_oximeter.jpg', 300, 300);

        $payload = [
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'product_name' => 'Digital Pulse Oximeter Pro',
            'business_unit' => 'Piece',
            'product_type' => 'Equipment',
            'status' => 'active',
            'product_image' => $image,
        ];

        $response = $this->postJson('/api/admin/inventory/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('product.product_name', 'Digital Pulse Oximeter Pro')
            ->assertJsonPath('product.business_unit', 'Piece')
            ->assertJsonPath('product.product_type', 'Equipment')
            ->assertJsonPath('product.created_by_admin_id', $this->admin->id);

        $product = InventoryProduct::where('product_name', 'Digital Pulse Oximeter Pro')->first();
        $this->assertNotNull($product);
        $this->assertNotNull($product->product_image);
        Storage::disk('public')->assertExists($product->product_image);
    }

    public function test_product_validation_rules(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->postJson('/api/admin/inventory/products', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id', 'product_name', 'business_unit', 'product_type']);
    }

    public function test_cannot_delete_category_or_brand_assigned_to_products(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $category = InventoryCategory::create([
            'name' => 'Pharmaceuticals',
            'slug' => 'pharmaceuticals',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $brand = InventoryBrand::create([
            'name' => 'Pfizer',
            'slug' => 'pfizer',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        InventoryProduct::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'product_name' => 'Antibiotic Syrup 100ml',
            'business_unit' => 'Bottle',
            'product_type' => 'Medicine',
            'status' => 'active',
            'created_by_admin_id' => $this->admin->id,
        ]);

        // Attempt category delete
        $catDeleteRes = $this->deleteJson("/api/admin/inventory/categories/{$category->id}");
        $catDeleteRes->assertStatus(422)
            ->assertJsonFragment(['message' => "Cannot delete category 'Pharmaceuticals' because it is assigned to 1 existing product(s). Please reassign or delete the products first."]);

        // Attempt brand delete
        $brandDeleteRes = $this->deleteJson("/api/admin/inventory/brands/{$brand->id}");
        $brandDeleteRes->assertStatus(422)
            ->assertJsonFragment(['message' => "Cannot delete brand 'Pfizer' because it is assigned to 1 existing product(s). Please reassign or delete the products first."]);
    }

    public function test_superadmin_can_access_overview_and_all_reports(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $category = InventoryCategory::create([
            'name' => 'General Equipment',
            'slug' => 'general-equipment',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        InventoryProduct::create([
            'category_id' => $category->id,
            'product_name' => 'Stethoscope Deluxe',
            'business_unit' => 'Piece',
            'product_type' => 'Equipment',
            'status' => 'active',
            'created_by_admin_id' => $this->admin->id,
        ]);

        $overviewRes = $this->getJson('/api/superadmin/inventory/overview');
        $overviewRes->assertStatus(200)
            ->assertJsonPath('summary.total_products', 1)
            ->assertJsonPath('summary.total_categories', 1)
            ->assertJsonPath('summary.contributing_admins_count', 1);

        $productsRes = $this->getJson('/api/superadmin/inventory/products');
        $productsRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_name', 'Stethoscope Deluxe')
            ->assertJsonPath('data.0.creator.name', $this->admin->name);

        $adminReportRes = $this->getJson('/api/superadmin/inventory/admin-report');
        $adminReportRes->assertStatus(200)
            ->assertJsonPath('admins.0.name', $this->admin->name)
            ->assertJsonPath('admins.0.total_products', 1);
    }

    public function test_superadmin_can_toggle_product_status_and_delete(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $category = InventoryCategory::create([
            'name' => 'Protective Gear',
            'slug' => 'protective-gear',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $product = InventoryProduct::create([
            'category_id' => $category->id,
            'product_name' => 'N95 Respirator Masks',
            'business_unit' => 'Box',
            'product_type' => 'Consumable',
            'status' => 'active',
            'created_by_admin_id' => $this->admin->id,
        ]);

        // Toggle status
        $statusRes = $this->patchJson("/api/superadmin/inventory/products/{$product->id}/status", [
            'status' => 'inactive',
        ]);
        $statusRes->assertStatus(200)
            ->assertJsonPath('product.status', 'inactive');

        // Delete product
        $deleteRes = $this->deleteJson("/api/superadmin/inventory/products/{$product->id}");
        $deleteRes->assertStatus(200);

        $this->assertSoftDeleted('inventory_products', [
            'id' => $product->id,
        ]);
    }
}

