<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\InventoryTransaction;

class InventoryController extends Controller
{
    public function index()
    {
        return Product::with('category')->get();
    }

    public function transactions(Product $product)
    {
        return InventoryTransaction::where('product_id', $product->id)->get();
    }

    public function history()
    {
        return InventoryTransaction::with(['product.category'])
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();
    }

    public function opname(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'actual_stock' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);
            $currentStock = $product->stock;
            $actualStock = $request->actual_stock;
            
            $difference = $actualStock - $currentStock;

            if ($difference != 0) {
                // Update stock
                $product->stock = $actualStock;
                $product->save();

                // Create transaction
                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => $difference > 0 ? 'in' : 'out',
                    'quantity' => abs($difference),
                    'reference_type' => 'Opname',
                    'notes' => $request->notes,
                ]);
            }

            return response()->json(['message' => 'Stock opname successful', 'product' => $product]);
        });
    }
}
