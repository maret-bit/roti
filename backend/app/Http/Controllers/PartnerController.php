<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index()
    {
        return response()->json(Partner::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $partner = Partner::create($request->only('name', 'location', 'phone'));
        return response()->json($partner, 201);
    }

    public function show(Partner $partner)
    {
        return response()->json($partner);
    }

    public function update(Request $request, Partner $partner)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $partner->update($request->only('name', 'location', 'phone'));
        return response()->json($partner);
    }

    public function destroy(Partner $partner)
    {
        $partner->delete();
        return response()->json(null, 204);
    }
}
