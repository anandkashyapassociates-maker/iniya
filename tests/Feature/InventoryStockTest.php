<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use App\Models\SuperAdmin;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryStockTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin1;

    protected Admin $admin2;

    protected SuperAdmin $superAdmin;

    protected string $admin1Token;

    protected string $admin2Token;

    protected string $superAdminToken;

    protected InventoryCategory $category;

    protected InventoryBrand $brand;

    protected Vendor $vendor;

    protected InventoryProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = SuperAdmin::create([
            'name' => 'Root Super Admin',
            'email' => 'root@example.com',
            'password' => Hash::make('Password@123'),
            'is_active' => true,
        ]);
        $this->superAdminToken = $this->superAdmin->createToken('sa-token', ['role:superadmin'])->plainTextToken;

        $this->admin1 = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Pharmacist Admin 1',
            'email' => 'pharm1@example.com',
            'mobile' => '9111111111',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);
        $this->admin1Token = $this->admin1->createToken('admin1-token', ['role:admin'])->plainTextToken;

        $this->admin2 = Admin::create([
            'super_admin_id' => $this->superAdmin->id,
            'name' => 'Store Admin 2',
            'email' => 'store2@example.com',
            'mobile' => '9222222222',
            'password' => Hash::make('Password@123'),
            'status' => 'active',
            'is_active' => true,
        ]);
        $this->admin2Token = $this->admin2->createToken('admin2-token', ['role:admin'])->plainTextToken;

        $this->category = InventoryCategory::create([
            'name' => 'Surgical Equipment',
            'slug' => 'surgical-equipment',
            'status' => 'active',
            'created_by' => $this->admin1->id,
        ]);

        $this->brand = InventoryBrand::create([
            'name' => 'MediCare Global',
            'slug' => 'medicare-global',
            'status' => 'active',
            'created_by' => $this->admin1->id,
        ]);

        $this->vendor = Vendor::create([
            'vendor_code' => 'VND-001',
            'vendor_name' => 'Apex Pharma Supplies',
            'company_name' => 'Apex Healthcare Ltd',
            'email' => 'apex@vendor.com',
            'mobile' => '9333333333',
            'status' => 'active',
        ]);

        $this->product = InventoryProduct::create([
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'product_name' => 'N95 Protective Respirator',
            'business_unit' => 'Box',
            'product_unit' => 10,
            'product_type' => 'Consumable',
            'status' => 'active',
            'quantity' => 0,
            'low_stock_threshold' => 15,
            'created_by_admin_id' => $this->admin1->id,
        ]);
    }

    /**
     * 1. Admin can list stocks with calculated summary metrics.
     */
    public function test_admin_can_view_stocks_list_with_metrics(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->getJson('/api/admin/inventory/stocks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'pagination' => ['total', 'current_page'],
                'metrics' => [
                    'total_products',
                    'in_stock_count',
                    'low_stock_count',
                    'out_of_stock_count',
                    'total_alerts',
                ],
            ]);

        $this->assertEquals(1, $response->json('metrics.total_products'));
        $this->assertEquals(1, $response->json('metrics.out_of_stock_count'));
    }

    /**
     * 2. Admin can add inventory stock for a product.
     */
    public function test_admin_can_add_inventory_stock_for_product(): void
    {
        $payload = [
            'quantity' => 50,
            'buy_price' => 120.00,
            'mrp' => 180.00,
            'vendor_id' => $this->vendor->id,
            'business_unit' => 'Box',
            'low_stock_threshold' => 10,
            'notes' => 'Batch #B2026-OCT arrival',
        ];

        $response = $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->postJson("/api/admin/inventory/stocks/{$this->product->id}/add", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('product.quantity', 50)
            ->assertJsonPath('product.buy_price', '120.00')
            ->assertJsonPath('product.mrp', '180.00')
            ->assertJsonPath('product.average_price', '120.00')
            ->assertJsonPath('product.vendor_id', $this->vendor->id);

        $this->assertDatabaseHas('inventory_products', [
            'id' => $this->product->id,
            'quantity' => 50,
            'buy_price' => 120.00,
            'mrp' => 180.00,
            'inventory_updated_by' => $this->admin1->id,
            'is_used' => true,
        ]);

        $this->assertDatabaseHas('inventory_stock_logs', [
            'product_id' => $this->product->id,
            'admin_id' => $this->admin1->id,
            'vendor_id' => $this->vendor->id,
            'quantity' => 50,
            'type' => 'purchase',
        ]);
    }

    /**
     * 3. The admin who added the inventory can edit it.
     */
    public function test_admin_who_added_inventory_can_edit_it(): void
    {
        // First Admin 1 adds stock
        $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->postJson("/api/admin/inventory/stocks/{$this->product->id}/add", [
                'quantity' => 30,
                'buy_price' => 100.00,
                'mrp' => 150.00,
            ]);

        // Admin 1 edits the stock record
        $updateResponse = $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->putJson("/api/admin/inventory/stocks/{$this->product->id}", [
                'quantity' => 28,
                'buy_price' => 105.00,
                'mrp' => 160.00,
                'average_price' => 105.00,
                'low_stock_threshold' => 10,
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('product.quantity', 28)
            ->assertJsonPath('product.buy_price', '105.00');

        $this->assertDatabaseHas('inventory_products', [
            'id' => $this->product->id,
            'quantity' => 28,
            'buy_price' => 105.00,
            'inventory_updated_by' => $this->admin1->id,
        ]);
    }

    /**
     * 4. Another admin cannot edit the inventory stock added by Admin 1.
     */
    public function test_another_admin_cannot_edit_inventory_stock(): void
    {
        // Admin 1 adds inventory
        $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->postJson("/api/admin/inventory/stocks/{$this->product->id}/add", [
                'quantity' => 25,
                'buy_price' => 80.00,
                'mrp' => 120.00,
            ]);

        // Reset auth guard in test environment
        auth('sanctum')->forgetUser();

        // Admin 2 tries to edit Admin 1's inventory
        $response = $this->withHeader('Authorization', 'Bearer '.$this->admin2Token)
            ->putJson("/api/admin/inventory/stocks/{$this->product->id}", [
                'quantity' => 10,
                'buy_price' => 70.00,
                'mrp' => 100.00,
                'average_price' => 70.00,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Unauthorized. Only the admin who added this inventory can edit it.');
    }

    /**
     * 5. Super Admin has read-only oversight: cannot add or edit stock.
     */
    public function test_superadmin_has_read_only_oversight(): void
    {
        // Superadmin can view stocks list
        $viewResponse = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->getJson('/api/superadmin/inventory/stocks');
        $viewResponse->assertStatus(200);

        // Superadmin cannot add stock
        $addResponse = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->postJson("/api/superadmin/inventory/stocks/{$this->product->id}/add", [
                'quantity' => 10,
                'buy_price' => 50,
                'mrp' => 80,
            ]);
        $addResponse->assertStatus(403);

        // Superadmin cannot edit stock
        $editResponse = $this->withHeader('Authorization', 'Bearer '.$this->superAdminToken)
            ->putJson("/api/superadmin/inventory/stocks/{$this->product->id}", [
                'quantity' => 10,
                'buy_price' => 50,
                'mrp' => 80,
                'average_price' => 50,
            ]);
        $editResponse->assertStatus(403);
    }

    /**
     * 6. Low stock products query accurately detects products below threshold.
     */
    public function test_low_stock_page_and_counts(): void
    {
        // Create an in-stock product (qty 100 > threshold 10)
        InventoryProduct::create([
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'product_name' => 'Abundant Sterile Gauze',
            'business_unit' => 'Pack',
            'product_unit' => 1,
            'product_type' => 'Consumable',
            'status' => 'active',
            'quantity' => 100,
            'low_stock_threshold' => 10,
            'created_by_admin_id' => $this->admin1->id,
        ]);

        // $this->product has quantity 0 (which is <= threshold 15) -> should appear in low-stock
        $response = $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->getJson('/api/admin/inventory/stocks/low-stock');

        $response->assertStatus(200)
            ->assertJsonPath('metrics.out_of_stock_count', 1);

        $items = $response->json('data');
        $this->assertCount(1, $items);
        $this->assertEquals($this->product->id, $items[0]['id']);
    }

    /**
     * 7. Admin can fetch active vendors list for dropdown.
     */
    public function test_admin_can_fetch_active_vendors(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->admin1Token)
            ->getJson('/api/admin/inventory/stocks/vendors');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }
}
