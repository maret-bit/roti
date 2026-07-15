<?php

namespace App\Http\Controllers;

use App\Models\Production;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function results()
    {
        $results = Production::with('product')
            ->where('type', 'result')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($results);
    }

    public function storeResult(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);
            
            // 1. Catat ke tabel productions
            $production = Production::create([
                'type' => 'result',
                'product_id' => $product->id,
                'quantity' => $request->quantity,
                'notes' => $request->notes,
            ]);

            // 2. Update stock
            $product->stock += $request->quantity;
            $product->save();

            // 3. Log ke inventory_transactions
            InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $request->quantity,
                'reference_type' => 'Production',
                'reference_id' => $production->id,
                'notes' => 'Hasil Produksi: ' . ($request->notes ?? ''),
            ]);

            return response()->json($production->load('product'), 201);
        });
    }

    public function destroyResult($id)
    {
        return DB::transaction(function () use ($id) {
            $production = Production::where('type', 'result')->findOrFail($id);
            
            $product = Product::findOrFail($production->product_id);
            
            // Revert stock
            $product->stock -= $production->quantity;
            $product->save();

            // Remove related inventory transaction
            InventoryTransaction::where('reference_type', 'Production')
                ->where('reference_id', $production->id)
                ->delete();

            $production->delete();

            return response()->json(null, 204);
        });
    }
}
