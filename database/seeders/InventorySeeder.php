<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\InventoryBrand;
use App\Models\InventoryCategory;
use App\Models\InventoryProduct;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InventorySeeder extends Seeder
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

        $categoriesData = [
            [
                'name' => 'Surgical Consumables & Disposables',
                'description' => 'Sterile surgical blades, sutures, disposable syringes, and operative consumables.',
            ],
            [
                'name' => 'Diagnostic & Monitoring Devices',
                'description' => 'ECG leads, digital BP monitors, glucometers, pulse oximeters, and patient monitors.',
            ],
            [
                'name' => 'Pharmaceuticals & IV Fluids',
                'description' => 'Emergency care ampoules, IV infusion bottles, antibiotics, and clinical solutions.',
            ],
            [
                'name' => 'Personal Protective Equipment (PPE)',
                'description' => 'Medical grade N95 respirators, surgical face masks, eye shields, and gowns.',
            ],
            [
                'name' => 'Dental Instruments & Materials',
                'description' => 'Dental composite resins, tooth extraction forceps, mirrors, and impression trays.',
            ],
            [
                'name' => 'Orthopedic Supports & Casts',
                'description' => 'Plaster of Paris rolls, orthopedic splints, knee braces, and cervical collars.',
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['name']] = InventoryCategory::firstOrCreate(
                ['name' => $c['name']],
                [
                    'slug' => Str::slug($c['name']),
                    'description' => $c['description'],
                    'status' => 'active',
                    'created_by' => $admin->id,
                ]
            );
        }

        $brandsData = [
            [
                'name' => '3M Healthcare',
                'description' => 'Global standard in infection prevention, surgical drapes, and wound dressings.',
            ],
            [
                'name' => 'Johnson & Johnson MedTech',
                'description' => 'Surgical sutures, sterilization systems, and advanced medical equipment.',
            ],
            [
                'name' => 'BD (Becton Dickinson)',
                'description' => 'World-leading medical technology for needles, syringes, and clinical diagnostics.',
            ],
            [
                'name' => 'Philips Healthcare',
                'description' => 'Advanced patient monitoring, ultrasound systems, and vital diagnostic sensors.',
            ],
            [
                'name' => 'Medtronic Health',
                'description' => 'Precision therapeutic technologies, surgical instruments, and cardiology monitors.',
            ],
            [
                'name' => 'Roche Diagnostics',
                'description' => 'Laboratory blood analysis kits, point-of-care testing systems, and reagents.',
            ],
        ];

        $brands = [];
        foreach ($brandsData as $b) {
            $brands[$b['name']] = InventoryBrand::firstOrCreate(
                ['name' => $b['name']],
                [
                    'slug' => Str::slug($b['name']),
                    'description' => $b['description'],
                    'status' => 'active',
                    'created_by' => $admin->id,
                ]
            );
        }

        $productsData = [
            [
                'category' => 'Personal Protective Equipment (PPE)',
                'brand' => '3M Healthcare',
                'name' => 'N95 Aura Surgical Respirator Face Masks',
                'business_unit' => 'Box',
                'product_type' => 'Consumable',
            ],
            [
                'category' => 'Surgical Consumables & Disposables',
                'brand' => 'Johnson & Johnson MedTech',
                'name' => 'Sterile Nitrile Surgical Gloves (Size 7.5)',
                'business_unit' => 'Box',
                'product_type' => 'Consumable',
            ],
            [
                'category' => 'Diagnostic & Monitoring Devices',
                'brand' => 'Philips Healthcare',
                'name' => 'High-Precision Digital Fingertip Pulse Oximeter',
                'business_unit' => 'Piece',
                'product_type' => 'Equipment',
            ],
            [
                'category' => 'Diagnostic & Monitoring Devices',
                'brand' => 'Medtronic Health',
                'name' => 'Clinical Digital Sphygmomanometer (BP Monitor)',
                'business_unit' => 'Piece',
                'product_type' => 'Equipment',
            ],
            [
                'category' => 'Surgical Consumables & Disposables',
                'brand' => 'BD (Becton Dickinson)',
                'name' => 'Sterile Hypodermic Syringes 5ml with 21G Needles',
                'business_unit' => 'Box',
                'product_type' => 'Consumable',
            ],
            [
                'category' => 'Pharmaceuticals & IV Fluids',
                'brand' => 'Roche Diagnostics',
                'name' => 'Normal Saline (0.9% NaCl) Sterile IV Infusion 500ml',
                'business_unit' => 'Bottle',
                'product_type' => 'Medicine',
            ],
            [
                'category' => 'Dental Instruments & Materials',
                'brand' => '3M Healthcare',
                'name' => 'Dental Light-Cured Universal Micro-Hybrid Composite',
                'business_unit' => 'Packet',
                'product_type' => 'Retail',
            ],
            [
                'category' => 'Orthopedic Supports & Casts',
                'brand' => 'Johnson & Johnson MedTech',
                'name' => 'Synthetic Fiberglass Casting Tape 4-Inch',
                'business_unit' => 'Roll',
                'product_type' => 'Consumable',
            ],
        ];

        foreach ($productsData as $p) {
            $catId = $categories[$p['category']]->id;
            $brandId = $brands[$p['brand']]->id;

            InventoryProduct::firstOrCreate(
                [
                    'category_id' => $catId,
                    'product_name' => $p['name'],
                ],
                [
                    'brand_id' => $brandId,
                    'business_unit' => $p['business_unit'],
                    'product_type' => $p['product_type'],
                    'status' => 'active',
                    'created_by_admin_id' => $admin->id,
                ]
            );
        }
    }
}

