<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\SalesStock;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function index()
    {
        $transfers = Transfer::with(['user', 'product'])->orderBy('created_at', 'desc')->get();
        return response()->json($transfers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);

            // 1. Catat ke tabel transfers
            $transfer = Transfer::create([
                'user_id' => $request->user_id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'notes' => $request->notes,
            ]);

            // 2. Kurangi stock gudang utama
            $product->stock -= $request->quantity;
            $product->save();

            // 3. Tambah stock sales
            $salesStock = SalesStock::firstOrCreate(
                ['user_id' => $request->user_id, 'product_id' => $request->product_id]
            );
            $salesStock->quantity += $request->quantity;
            $salesStock->save();

            // 4. Log ke inventory_transactions
            InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => $request->quantity,
                'reference_type' => 'Transfer',
                'reference_id' => $transfer->id,
                'notes' => 'Transfer ke Sales ID ' . $request->user_id . ($request->notes ? ' - ' . $request->notes : ''),
            ]);

            return response()->json($transfer->load(['user', 'product']), 201);
        });
    }

    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $transfer = Transfer::findOrFail($id);
            
            $product = Product::findOrFail($transfer->product_id);
            $salesStock = SalesStock::where('user_id', $transfer->user_id)
                                    ->where('product_id', $transfer->product_id)
                                    ->first();
            
            // Revert stock gudang utama
            $product->stock += $transfer->quantity;
            $product->save();

            // Revert stock sales
            if ($salesStock) {
                $salesStock->quantity -= $transfer->quantity;
                $salesStock->save();
            }

            // Remove related inventory transaction
            InventoryTransaction::where('reference_type', 'Transfer')
                ->where('reference_id', $transfer->id)
                ->delete();

            $transfer->delete();

            return response()->json(null, 204);
        });
    }
}
