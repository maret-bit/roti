<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(Unit::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:units,name',
        ]);

        $unit = Unit::create($validated);
        return response()->json($unit, 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:units,name,'.$id,
        ]);

        $unit = Unit::findOrFail($id);
        $unit->update($validated);
        return response()->json($unit, 200);
    }

    public function destroy($id)
    {
        Unit::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
