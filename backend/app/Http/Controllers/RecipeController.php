<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function index()
    {
        $recipes = Recipe::with(['ingredients.product'])->get();
        return response()->json($recipes);
    }

    public function show($id)
    {
        $recipe = Recipe::with(['ingredients.product'])->findOrFail($id);
        return response()->json($recipe);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ingredients' => 'required|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
            'ingredients.*.unit' => 'required|string',
        ]);

        return DB::transaction(function () use ($request) {
            $recipe = Recipe::create([
                'name' => $request->name,
            ]);

            foreach ($request->ingredients as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'product_id' => $ingredient['product_id'],
                    'quantity' => $ingredient['quantity'],
                    'unit' => $ingredient['unit'],
                ]);
            }

            return response()->json($recipe->load(['ingredients.product']), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ingredients' => 'required|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
            'ingredients.*.unit' => 'required|string',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $recipe = Recipe::findOrFail($id);
            
            $recipe->update([
                'name' => $request->name,
            ]);

            $recipe->ingredients()->delete();

            foreach ($request->ingredients as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'product_id' => $ingredient['product_id'],
                    'quantity' => $ingredient['quantity'],
                    'unit' => $ingredient['unit'],
                ]);
            }

            return response()->json($recipe->load(['ingredients.product']), 200);
        });
    }

    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $recipe = Recipe::findOrFail($id);
            $recipe->ingredients()->delete();
            $recipe->delete();
            return response()->json(null, 204);
        });
    }
}
