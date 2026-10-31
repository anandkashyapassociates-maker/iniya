<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
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

    public function test_guest_cannot_access_categories_api(): void
    {
        $this->getJson('/api/admin/categories')->assertStatus(401);
        $this->postJson('/api/admin/categories', [])->assertStatus(401);
        $this->getJson('/api/superadmin/categories')->assertStatus(401);
    }

    public function test_admin_can_create_category_with_auto_generated_slug(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $payload = [
            'name' => 'Cardiology & Heart Care',
            'description' => 'Heart diagnosis and ECG monitoring department.',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/categories', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Category created successfully.')
            ->assertJsonPath('category.name', 'Cardiology & Heart Care')
            ->assertJsonPath('category.slug', 'cardiology-heart-care')
            ->assertJsonPath('category.admin_id', $this->admin->id);

        $this->assertDatabaseHas('categories', [
            'name' => 'Cardiology & Heart Care',
            'slug' => 'cardiology-heart-care',
            'admin_id' => $this->admin->id,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_create_category_with_optional_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $imageFile = UploadedFile::fake()->image('cardio_icon.png', 120, 120);

        $response = $this->postJson('/api/admin/categories', [
            'name' => 'Dental Care',
            'description' => 'Orthodontic and dental clinical services.',
            'image' => $imageFile,
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $category = Category::where('name', 'Dental Care')->first();
        $this->assertNotNull($category->image);
        Storage::disk('public')->assertExists($category->image);
    }

    public function test_category_validation_requires_name(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->postJson('/api/admin/categories', []);
        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_list_and_search_categories(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Pediatrics Unit',
            'slug' => 'pediatrics-unit',
            'is_active' => true,
        ]);

        Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Orthopedics Bone Clinic',
            'slug' => 'orthopedics-bone-clinic',
            'is_active' => false,
        ]);

        // Search test
        $searchResponse = $this->getJson('/api/admin/categories?search=Bone');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Orthopedics Bone Clinic');

        // Status filter test
        $activeResponse = $this->getJson('/api/admin/categories?status=active');
        $activeResponse->assertStatus(200)
            ->assertJsonPath('data.0.is_active', true);
    }

    public function test_admin_can_view_single_category(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Dermatology & Skin',
        ]);

        $response = $this->getJson("/api/admin/categories/{$category->id}");
        $response->assertStatus(200)
            ->assertJsonPath('id', $category->id)
            ->assertJsonPath('name', 'Dermatology & Skin')
            ->assertJsonPath('admin.id', $this->admin->id);
    }

    public function test_admin_can_update_category(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Neurology',
            'slug' => 'neurology',
            'is_active' => true,
        ]);

        $updateResponse = $this->putJson("/api/admin/categories/{$category->id}", [
            'name' => 'Advanced Neurology & Brain Care',
            'description' => 'Updated brain care neurology descriptions.',
            'is_active' => false,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('message', 'Category updated successfully.')
            ->assertJsonPath('category.name', 'Advanced Neurology & Brain Care')
            ->assertJsonPath('category.is_active', false);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Advanced Neurology & Brain Care',
            'is_active' => false,
        ]);
    }

    public function test_admin_can_delete_category(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin, ['role:admin']);

        $imageFile = UploadedFile::fake()->image('temp_cat.png');
        $storedPath = $imageFile->store('categories', 'public');

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Temporary Category',
            'image' => $storedPath,
        ]);

        Storage::disk('public')->assertExists($storedPath);

        $response = $this->deleteJson("/api/admin/categories/{$category->id}");
        $response->assertStatus(200)
            ->assertJsonPath('message', "Category 'Temporary Category' deleted successfully.");

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_superadmin_can_view_all_categories_with_creator_admin_details(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Radiology & X-Ray Diagnostics',
        ]);

        $response = $this->getJson('/api/superadmin/categories');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Radiology & X-Ray Diagnostics')
            ->assertJsonPath('data.0.admin.name', $this->admin->name)
            ->assertJsonPath('data.0.admin.email', $this->admin->email);
    }

    public function test_superadmin_can_view_category_statistics(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        Category::factory()->count(3)->create(['admin_id' => $this->admin->id, 'is_active' => true]);
        Category::factory()->count(2)->create(['admin_id' => $this->admin->id, 'is_active' => false]);

        $response = $this->getJson('/api/superadmin/categories/stats');
        $response->assertStatus(200)
            ->assertJsonPath('total', 5)
            ->assertJsonPath('active', 3)
            ->assertJsonPath('inactive', 2)
            ->assertJsonPath('creators_count', 1);
    }

    public function test_superadmin_has_power_to_delete_any_category(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Category To Be Deleted by SuperAdmin',
        ]);

        $response = $this->deleteJson("/api/superadmin/categories/{$category->id}");
        $response->assertStatus(200)
            ->assertJsonPath('message', "Category 'Category To Be Deleted by SuperAdmin' deleted successfully by Super Admin.");

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
