<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = Admin::first();
        if (! $admin) {
            return;
        }

        $categories = [
            [
                'name' => 'General Medicine & OPD',
                'description' => 'Comprehensive outpatient consultations, preventive health checkups, and routine clinical care.',
            ],
            [
                'name' => 'Cardiology & Heart Care',
                'description' => 'ECG screenings, cardiovascular monitoring, hypertension management, and specialist triage.',
            ],
            [
                'name' => 'Pediatrics & Child Health',
                'description' => 'Neonatal care, infant immunizations, growth tracking, and pediatric consultations.',
            ],
            [
                'name' => 'Dental Care & Surgery',
                'description' => 'Oral hygiene, tooth extractions, orthodontic assessments, and restorative dental procedures.',
            ],
            [
                'name' => 'Dermatology & Skin Clinic',
                'description' => 'Skin examinations, allergy diagnostics, dermatological treatments, and cosmetic care.',
            ],
            [
                'name' => 'Laboratory & Diagnostics',
                'description' => 'Blood tests, pathology screenings, diagnostic imaging, and routine laboratory profiles.',
            ],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'admin_id' => $admin->id,
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                ]
            );
        }
    }
}
