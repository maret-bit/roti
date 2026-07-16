<?php

namespace App\Http\Controllers;

use App\Models\SalesTransaction;
use App\Models\SalesStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesTransaction::with(['partner', 'product', 'user'])->orderBy('created_at', 'desc');
        
        if ($request->user() && $request->user()->role === 'user_sales') {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:titip,jual',
            'quantity' => 'required|numeric|min:0.01',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request) {
            $userId = $request->user() ? $request->user()->id : 1; // Fallback to 1 if no auth (e.g. testing)

            // Cek stok sales
            $salesStock = SalesStock::where('user_id', $userId)
                                    ->where('product_id', $request->product_id)
                                    ->first();

            if (!$salesStock || $salesStock->quantity < $request->quantity) {
                return response()->json(['message' => 'Stok yang Anda bawa tidak mencukupi'], 400);
            }

            // Kurangi stok sales
            $salesStock->quantity -= $request->quantity;
            $salesStock->save();

            // Buat transaksi
            $transaction = SalesTransaction::create([
                'user_id' => $userId,
                'partner_id' => $request->partner_id,
                'product_id' => $request->product_id,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'price' => $request->price,
                'total_price' => $request->quantity * $request->price,
                'notes' => $request->notes,
            ]);

            return response()->json($transaction->load(['partner', 'product', 'user']), 201);
        });
    }

    public function storePastPiutang(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'partner_id' => 'required|exists:partners,id',
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:titip,jual',
            'quantity' => 'required|numeric|min:1',
            'price' => 'required|numeric|min:0',
            'created_at' => 'required|date'
        ]);

        $transaction = SalesTransaction::create([
            'user_id' => $request->user_id,
            'partner_id' => $request->partner_id,
            'product_id' => $request->product_id,
            'type' => $request->type,
            'quantity' => $request->quantity,
            'price' => $request->price,
            'total_price' => $request->quantity * $request->price,
            'status' => 'belum_bayar',
            'created_at' => $request->created_at,
            'updated_at' => now()
        ]);

        return response()->json($transaction->load('product'), 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:titip,jual',
            'quantity' => 'required|numeric|min:0.01',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request, $id) {
            $transaction = SalesTransaction::findOrFail($id);
            
            // Revert old stock
            $oldStock = SalesStock::firstOrCreate([
                'user_id' => $transaction->user_id,
                'product_id' => $transaction->product_id
            ]);
            $oldStock->quantity += $transaction->quantity;
            $oldStock->save();

            // Deduct new stock
            $newStock = SalesStock::firstOrCreate([
                'user_id' => $transaction->user_id,
                'product_id' => $request->product_id
            ]);
            $newStock->quantity -= $request->quantity;
            $newStock->save();

            $transaction->update([
                'partner_id' => $request->partner_id,
                'product_id' => $request->product_id,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'price' => $request->price,
                'total_price' => ($request->quantity - $transaction->returned_quantity) * $request->price,
                'notes' => $request->notes,
            ]);

            return response()->json($transaction->load(['partner', 'product', 'user']));
        });
    }

    public function destroy($id, Request $request)
    {
        return DB::transaction(function () use ($id, $request) {
            $transaction = SalesTransaction::findOrFail($id);
            
            // Revert stok sales
            $salesStock = SalesStock::firstOrCreate([
                'user_id' => $transaction->user_id,
                'product_id' => $transaction->product_id
            ]);
            $salesStock->quantity += $transaction->quantity;
            $salesStock->save();

            $transaction->delete();

            return response()->json(null, 204);
        });
    }

    public function pay(Request $request, $id)
    {
        $request->validate([
            'returned_quantity' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $transaction = SalesTransaction::findOrFail($id);
            
            if ($transaction->status === 'paid') {
                return response()->json(['message' => 'Transaksi sudah dibayar'], 400);
            }

            if ($request->returned_quantity > $transaction->quantity) {
                return response()->json(['message' => 'Jumlah retur melebihi quantity transaksi'], 400);
            }

            // Kembalikan barang retur ke stok sales
            if ($request->returned_quantity > 0) {
                $salesStock = SalesStock::firstOrCreate([
                    'user_id' => $transaction->user_id,
                    'product_id' => $transaction->product_id
                ]);
                $salesStock->quantity += $request->returned_quantity;
                $salesStock->save();
            }

            // Update transaksi
            $transaction->status = 'paid';
            $transaction->returned_quantity = $request->returned_quantity;
            $transaction->paid_amount = $request->paid_amount;
            $transaction->total_price = ($transaction->quantity - $request->returned_quantity) * $transaction->price; // Update total_price to reflect actual sales
            $transaction->save();

            return response()->json($transaction->load(['partner', 'product', 'user']));
        });
    }

    public function myStock(Request $request)
    {
        $userId = $request->input('user_id') ?: ($request->user() ? $request->user()->id : 1);
        $stocks = SalesStock::with('product')->where('user_id', $userId)->get();
        return response()->json($stocks);
    }

    public function returnStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request) {
            $userId = $request->user() ? $request->user()->id : 1;
            
            $salesStock = SalesStock::where('user_id', $userId)
                                    ->where('product_id', $request->product_id)
                                    ->first();

            if (!$salesStock || $salesStock->quantity < $request->quantity) {
                return response()->json(['message' => 'Stok yang Anda bawa tidak mencukupi untuk dikembalikan'], 400);
            }

            // Kurangi stok sales
            $salesStock->quantity -= $request->quantity;
            $salesStock->save();

            // Tambah stok gudang utama
            $product = \App\Models\Product::findOrFail($request->product_id);
            $product->stock += $request->quantity;
            $product->save();

            // Log ke inventory_transactions
            \App\Models\InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $request->quantity,
                'reference_type' => 'ReturnFromSales',
                'reference_id' => $userId,
                'notes' => 'Pengembalian stok dari Sales ' . ($request->user() ? $request->user()->name : $userId) . ($request->notes ? ' - ' . $request->notes : ''),
            ]);

            return response()->json(['message' => 'Stok berhasil dikembalikan ke gudang utama']);
        });
    }

    public function salesDashboard(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        $today = \Carbon\Carbon::today();

        // 1. Stock transfers
        $transfers = \App\Models\Transfer::with('product')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $todayTransfers = $transfers->filter(function($t) use ($today) {
            return \Carbon\Carbon::parse($t->created_at)->isSameDay($today);
        })->values();

        $pastTransfers = $transfers->filter(function($t) use ($today) {
            return !\Carbon\Carbon::parse($t->created_at)->isSameDay($today);
        })->values();

        // 2. Produk terjual/Titip hari ini
        $allTransactions = SalesTransaction::with(['product', 'partner'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $todayTransactions = $allTransactions->filter(function($t) use ($today) {
            return \Carbon\Carbon::parse($t->created_at)->isSameDay($today);
        })->values();

        $pastTransactions = $allTransactions->filter(function($t) use ($today) {
            return !\Carbon\Carbon::parse($t->created_at)->isSameDay($today);
        })->values();

        $todayJual = $todayTransactions->where('type', 'jual')->values();
        $todayTitip = $todayTransactions->where('type', 'titip')->values();

        // 3. Penerimaan uang hari ini
        $todayReceipts = SalesTransaction::where('user_id', $userId)
            ->where('status', 'paid')
            ->whereDate('updated_at', $today)
            ->get();
        
        $receiptJual = $todayReceipts->where('type', 'jual')->sum('paid_amount');
        $receiptTitip = $todayReceipts->where('type', 'titip')->sum('paid_amount');

        return response()->json([
            'transfers' => [
                'today' => $todayTransfers,
                'past' => $pastTransfers
            ],
            'transactions' => [
                'jual' => $todayJual,
                'titip' => $todayTitip,
                'today' => $todayTransactions,
                'past' => $pastTransactions
            ],
            'receipts' => [
                'jual' => $receiptJual,
                'titip' => $receiptTitip,
                'total' => $receiptJual + $receiptTitip
            ]
        ]);
    }
}
