<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
        ];

        $response = $this->postJson('/api/admin/categories', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Category created successfully.')
            ->assertJsonPath('category.name', 'Cardiology & Heart Care')
            ->assertJsonPath('category.slug', 'cardiology-heart-care')
            ->assertJsonPath('category.description', 'Heart diagnosis and ECG monitoring department.')
            ->assertJsonPath('category.admin_id', $this->admin->id);

        $this->assertDatabaseHas('categories', [
            'name' => 'Cardiology & Heart Care',
            'slug' => 'cardiology-heart-care',
            'description' => 'Heart diagnosis and ECG monitoring department.',
            'admin_id' => $this->admin->id,
        ]);
    }

    public function test_admin_can_create_category_with_custom_slug(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $response = $this->postJson('/api/admin/categories', [
            'name' => 'Dental Care & Surgery',
            'slug' => 'custom-dental-specialty',
            'description' => 'Orthodontic and dental clinical services.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('category.slug', 'custom-dental-specialty');

        $this->assertDatabaseHas('categories', [
            'name' => 'Dental Care & Surgery',
            'slug' => 'custom-dental-specialty',
            'admin_id' => $this->admin->id,
        ]);
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
            'description' => 'Child health services',
        ]);

        Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Orthopedics Bone Clinic',
            'slug' => 'orthopedics-bone-clinic',
            'description' => 'Bone fracture and joint care',
        ]);

        // Search by keyword
        $searchResponse = $this->getJson('/api/admin/categories?search=Bone');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Orthopedics Bone Clinic');
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
            'name' => 'ENT Specialist',
            'slug' => 'ent-specialist',
            'description' => 'Old description',
        ]);

        $response = $this->putJson("/api/admin/categories/{$category->id}", [
            'name' => 'Advanced ENT & Audiology',
            'slug' => 'advanced-ent',
            'description' => 'Ear, nose, throat and hearing diagnostics.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Category updated successfully.')
            ->assertJsonPath('category.name', 'Advanced ENT & Audiology')
            ->assertJsonPath('category.slug', 'advanced-ent')
            ->assertJsonPath('category.description', 'Ear, nose, throat and hearing diagnostics.');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Advanced ENT & Audiology',
            'slug' => 'advanced-ent',
        ]);
    }

    public function test_admin_can_delete_category(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Ophthalmology',
            'slug' => 'ophthalmology',
        ]);

        $response = $this->deleteJson("/api/admin/categories/{$category->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_superadmin_can_list_categories_with_creator_admin_details(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Neurology & Brain Clinic',
            'slug' => 'neurology-brain-clinic',
        ]);

        $response = $this->getJson('/api/superadmin/categories');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Neurology & Brain Clinic')
            ->assertJsonPath('data.0.admin.id', $this->admin->id)
            ->assertJsonPath('data.0.admin.name', $this->admin->name);
    }

    public function test_superadmin_cannot_delete_category(): void
    {
        Sanctum::actingAs($this->superAdmin, ['role:superadmin']);

        $category = Category::factory()->create([
            'admin_id' => $this->admin->id,
            'name' => 'Psychiatry & Mental Health',
            'slug' => 'psychiatry-mental-health',
        ]);

        $response = $this->deleteJson("/api/superadmin/categories/{$category->id}");
        $response->assertStatus(403)
            ->assertJsonPath('message', 'Unauthorized. Super Admin has read-only oversight. Deleting categories is restricted to creator admins.');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_category_stats_endpoint(): void
    {
        Sanctum::actingAs($this->admin, ['role:admin']);

        Category::factory()->count(3)->create(['admin_id' => $this->admin->id]);

        $response = $this->getJson('/api/admin/categories/stats');
        $response->assertStatus(200)
            ->assertJsonStructure(['total']);
    }
}
