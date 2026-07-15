<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Admin User',
            'email' => 'admin@bakery.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        \App\Models\User::create([
            'name' => 'Sales User',
            'email' => 'sales@bakery.com',
            'password' => bcrypt('password'),
            'role' => 'user_sales',
        ]);

        \App\Models\User::create([
            'name' => 'Produksi User',
            'email' => 'produksi@bakery.com',
            'password' => bcrypt('password'),
            'role' => 'user_produksi',
        ]);

        $cat1 = \App\Models\Category::create(['name' => 'Bahan Baku']);
        $cat2 = \App\Models\Category::create(['name' => 'Produk Jadi']);

        $prod1 = \App\Models\Product::create([
            'name' => 'Tepung Terigu',
            'category_id' => $cat1->id,
            'base_unit' => 'kg',
            'stock' => 100,
        ]);

        \App\Models\UnitConversion::create([
            'product_id' => $prod1->id,
            'from_unit' => 'karung',
            'to_unit' => 'kg',
            'conversion_rate' => 25,
        ]);
    }
}
