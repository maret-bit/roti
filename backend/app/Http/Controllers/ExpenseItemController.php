<?php

namespace App\Http\Controllers;

use App\Models\ExpenseItem;
use Illuminate\Http\Request;

class ExpenseItemController extends Controller
{
    public function index()
    {
        return response()->json(ExpenseItem::with('category')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'name' => 'required|string|max:255',
        ]);

        $expenseItem = ExpenseItem::create($validated);
        $expenseItem->load('category');
        return response()->json($expenseItem, 201);
    }

    public function update(Request $request, ExpenseItem $expenseItem)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'name' => 'required|string|max:255',
        ]);

        $expenseItem->update($validated);
        $expenseItem->load('category');
        return response()->json($expenseItem);
    }

    public function destroy(ExpenseItem $expenseItem)
    {
        $expenseItem->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
