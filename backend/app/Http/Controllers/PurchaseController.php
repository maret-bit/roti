<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index()
    {
        return Purchase::with(['user', 'details.product'])->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'required|unique:purchases',
            'purchase_date' => 'required|date',
            'details' => 'required|array',
            'details.*.product_id' => 'required|exists:products,id',
            'details.*.quantity' => 'required|numeric',
            'details.*.unit' => 'required',
            'details.*.price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            $totalAmount = 0;
            foreach ($request->details as $detail) {
                $totalAmount += ($detail['quantity'] * $detail['price']);
            }

            $purchase = Purchase::create([
                'invoice_number' => $request->invoice_number,
                'user_id' => $request->user()->id,
                'purchase_date' => $request->purchase_date,
                'total_amount' => $totalAmount,
            ]);

            foreach ($request->details as $detail) {
                PurchaseDetail::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $detail['product_id'],
                    'quantity' => $detail['quantity'],
                    'unit' => $detail['unit'],
                    'price' => $detail['price'],
                    'subtotal' => $detail['quantity'] * $detail['price'],
                ]);

                // Update stock
                $product = Product::find($detail['product_id']);
                $stockToAdd = $detail['quantity'];

                if ($detail['unit'] !== $product->base_unit) {
                    $conversion = \App\Models\UnitConversion::where('product_id', $product->id)
                        ->where('from_unit', $detail['unit'])
                        ->where('to_unit', $product->base_unit)
                        ->first();
                    
                    if ($conversion) {
                        $stockToAdd = $detail['quantity'] * $conversion->conversion_rate;
                    }
                }

                $product->stock += $stockToAdd;
                $product->save();

                InventoryTransaction::create([
                    'product_id' => $detail['product_id'],
                    'type' => 'in',
                    'quantity' => $stockToAdd,
                    'reference_type' => 'purchase',
                    'reference_id' => $purchase->id,
                    'notes' => 'Pembelian invoice ' . $purchase->invoice_number . ' (' . $detail['quantity'] . ' ' . $detail['unit'] . ')',
                ]);
            }

            return response()->json($purchase, 201);
        });
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'invoice_number' => 'required|unique:purchases,invoice_number,' . $id,
            'purchase_date' => 'required|date',
            'details' => 'required|array',
            'details.*.product_id' => 'required|exists:products,id',
            'details.*.quantity' => 'required|numeric|min:0.01',
            'details.*.unit' => 'required|string',
            'details.*.price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $purchase = Purchase::with('details')->findOrFail($id);
            
            // Revert existing stock based on the EXACT historical transactions
            $transactions = InventoryTransaction::where('reference_type', 'purchase')
                ->where('reference_id', $purchase->id)
                ->get();
                
            foreach ($transactions as $transaction) {
                $product = Product::find($transaction->product_id);
                if ($product) {
                    // This subtracts the exact quantity that was originally added
                    $product->stock -= $transaction->quantity;
                    $product->save();
                }
            }
            
            // Delete old details and transactions
            InventoryTransaction::where('reference_type', 'purchase')->where('reference_id', $purchase->id)->delete();
            $purchase->details()->delete();

            // Update purchase
            $purchase->update([
                'invoice_number' => $request->invoice_number,
                'purchase_date' => $request->purchase_date,
                'total_amount' => collect($request->details)->sum(function($d) {
                    return $d['quantity'] * $d['price'];
                }),
            ]);

            // Apply new details
            foreach ($request->details as $detail) {
                PurchaseDetail::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $detail['product_id'],
                    'quantity' => $detail['quantity'],
                    'unit' => $detail['unit'],
                    'price' => $detail['price'],
                ]);

                $product = Product::find($detail['product_id']);
                $stockToAdd = $detail['quantity'];
                
                if ($detail['unit'] !== $product->base_unit) {
                    $conversion = \App\Models\UnitConversion::where('product_id', $product->id)
                        ->where('from_unit', $detail['unit'])
                        ->where('to_unit', $product->base_unit)
                        ->first();
                    if ($conversion) {
                        $stockToAdd = $detail['quantity'] * $conversion->conversion_rate;
                    }
                }

                $product->stock += $stockToAdd;
                $product->save();

                InventoryTransaction::create([
                    'product_id' => $detail['product_id'],
                    'type' => 'in',
                    'quantity' => $stockToAdd,
                    'reference_type' => 'purchase',
                    'reference_id' => $purchase->id,
                    'notes' => 'Edit Pembelian invoice ' . $purchase->invoice_number . ' (' . $detail['quantity'] . ' ' . $detail['unit'] . ')',
                ]);
            }

            return response()->json($purchase->load(['user', 'details.product']), 200);
        });
    }

    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $purchase = Purchase::with('details')->findOrFail($id);
            
            // Revert existing stock based on the EXACT historical transactions
            $transactions = InventoryTransaction::where('reference_type', 'purchase')
                ->where('reference_id', $purchase->id)
                ->get();
                
            foreach ($transactions as $transaction) {
                $product = Product::find($transaction->product_id);
                if ($product) {
                    // This subtracts the exact quantity that was originally added
                    $product->stock -= $transaction->quantity;
                    $product->save();
                }
            }
            
            // Delete old details and transactions
            InventoryTransaction::where('reference_type', 'purchase')->where('reference_id', $purchase->id)->delete();
            $purchase->details()->delete();
            $purchase->delete();

            return response()->json(null, 204);
        });
    }
}
