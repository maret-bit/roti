<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with(['category', 'unitConversions'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'base_unit' => 'required|string|max:50',
            'stock' => 'nullable|numeric',
            'selling_price' => 'nullable|numeric|min:0'
        ]);

        $validated['stock'] = $validated['stock'] ?? 0;

        $product = Product::create($validated);
        $product->load('category');

        return response()->json($product, 201);
    }

    public function destroy($id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'base_unit' => 'required|string|max:50',
            'selling_price' => 'nullable|numeric|min:0'
        ]);

        $product = Product::findOrFail($id);
        $product->update($validated);
        $product->load('category');

        return response()->json($product, 200);
    }
}
