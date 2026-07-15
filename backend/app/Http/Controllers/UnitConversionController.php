<?php

namespace App\Http\Controllers;

use App\Models\UnitConversion;
use Illuminate\Http\Request;

class UnitConversionController extends Controller
{
    public function index()
    {
        return response()->json(UnitConversion::with('product')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_unit' => 'required|string|max:50',
            'to_unit' => 'required|string|max:50',
            'conversion_rate' => 'required|numeric|min:0.01',
        ]);

        $conversion = UnitConversion::create($validated);
        $conversion->load('product');

        return response()->json($conversion, 201);
    }

    public function destroy($id)
    {
        UnitConversion::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_unit' => 'required|string|max:50',
            'to_unit' => 'required|string|max:50',
            'conversion_rate' => 'required|numeric|min:0.01',
        ]);

        $conversion = UnitConversion::findOrFail($id);
        $conversion->update($validated);
        $conversion->load('product');

        return response()->json($conversion, 200);
    }
}
