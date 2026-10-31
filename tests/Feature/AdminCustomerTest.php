<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCustomerTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'name' => 'Test Admin',
            'email' => 'testadmin_'.uniqid().'@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_customers_api(): void
    {
        $response = $this->getJson('/api/admin/customers');
        $response->assertStatus(401);
    }

    public function test_admin_can_create_customer(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $payload = [
            'name' => 'Rahul Sharma',
            'mobile' => '9876543210',
            'email' => 'rahul@example.com',
            'gender' => 'male',
            'age' => 28,
            'address' => 'Plot 42, Civil Lines, Jaipur, Rajasthan',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/customers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Customer created successfully.')
            ->assertJsonPath('customer.name', 'Rahul Sharma')
            ->assertJsonPath('customer.mobile', '9876543210')
            ->assertJsonPath('customer.gender', 'male')
            ->assertJsonPath('customer.age', 28);

        $this->assertDatabaseHas('customers', [
            'name' => 'Rahul Sharma',
            'mobile' => '9876543210',
            'email' => 'rahul@example.com',
        ]);
    }

    public function test_admin_can_create_customer_with_optional_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $file = UploadedFile::fake()->image('patient.jpg');

        $response = $this->postJson('/api/admin/customers', [
            'name' => 'Kavita Roy',
            'mobile' => '9888877777',
            'gender' => 'female',
            'age' => 29,
            'address' => '501 Rosewood, Pune',
            'image' => $file,
        ]);

        $response->assertStatus(201);
        $customer = Customer::where('name', 'Kavita Roy')->first();
        $this->assertNotNull($customer->image);
        Storage::disk('public')->assertExists($customer->image);
    }

    public function test_customer_creation_validation(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        // Missing required fields
        $response = $this->postJson('/api/admin/customers', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'mobile', 'gender', 'age', 'address']);
    }

    public function test_admin_can_list_and_search_customers(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Priya Patel',
            'mobile' => '9123456780',
            'email' => 'priya@example.com',
            'gender' => 'female',
            'age' => 25,
            'address' => '12 MG Road, Ahmedabad',
        ]);

        $response = $this->getJson('/api/admin/customers?search=Priya');
        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Priya Patel']);
    }

    public function test_admin_can_update_customer(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Amit Verma',
            'mobile' => '9988776655',
            'email' => 'amit@example.com',
            'gender' => 'male',
            'age' => 32,
            'address' => 'Old Address',
        ]);

        $response = $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Amit Kumar Verma',
            'mobile' => '9988776655',
            'email' => 'amit.verma@example.com',
            'gender' => 'male',
            'age' => 33,
            'address' => 'New Address, Delhi',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('customer.name', 'Amit Kumar Verma')
            ->assertJsonPath('customer.age', 33);
    }

    public function test_admin_can_update_customer_with_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Rohit Roy',
            'mobile' => '9988112233',
            'gender' => 'male',
            'age' => 27,
            'address' => 'Salt Lake, Kolkata',
        ]);

        $file = UploadedFile::fake()->image('avatar_new.png');

        $response = $this->postJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Rohit Roy Updated',
            'mobile' => '9988112233',
            'gender' => 'male',
            'age' => 28,
            'address' => 'Salt Lake Sector 5, Kolkata',
            'image' => $file,
        ]);

        $response->assertStatus(200);
        $customer->refresh();
        $this->assertNotNull($customer->image);
        $this->assertNotNull($customer->image_url);
        Storage::disk('public')->assertExists($customer->image);
    }

    public function test_admin_can_remove_customer_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $initialFile = UploadedFile::fake()->image('initial.png')->store('customers', 'public');

        $customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Preeti Jha',
            'mobile' => '9988443322',
            'gender' => 'female',
            'age' => 24,
            'address' => 'Patna, Bihar',
            'image' => $initialFile,
        ]);

        $response = $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Preeti Jha',
            'mobile' => '9988443322',
            'gender' => 'female',
            'age' => 24,
            'address' => 'Patna, Bihar',
            'remove_image' => true,
        ]);

        $response->assertStatus(200);
        $customer->refresh();
        $this->assertNull($customer->image);
        Storage::disk('public')->assertMissing($initialFile);
    }

    public function test_admin_can_delete_customer(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Delete Me',
            'mobile' => '9000000000',
            'gender' => 'other',
            'age' => 20,
        ]);

        $response = $this->deleteJson("/api/admin/customers/{$customer->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('customers', [
            'id' => $customer->id,
        ]);
    }

    public function test_non_creator_admin_cannot_edit_or_delete_customer(): void
    {
        $otherAdmin = Admin::create([
            'name' => 'Dr. Second Admin',
            'email' => 'second_admin_'.uniqid().'@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'admin_id' => $this->admin->id,
            'name' => 'Original Customer',
            'mobile' => '9111111111',
            'gender' => 'male',
            'age' => 45,
            'address' => 'Delhi',
        ]);

        Sanctum::actingAs($otherAdmin, ['role:admin']);

        // Attempt edit by other admin
        $editRes = $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Hacked Customer',
            'mobile' => '9111111111',
            'gender' => 'male',
            'age' => 46,
            'address' => 'Delhi Updated',
        ]);
        $editRes->assertStatus(403);

        // Attempt delete by other admin
        $deleteRes = $this->deleteJson("/api/admin/customers/{$customer->id}");
        $deleteRes->assertStatus(403);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'Original Customer',
        ]);
    }
}
