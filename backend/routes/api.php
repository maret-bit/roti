<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UnitConversionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UnitController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('purchases', PurchaseController::class);
    Route::post('/inventory/opname', [InventoryController::class, 'opname']);
    Route::get('/inventory/history', [InventoryController::class, 'history']);
    Route::get('/inventory', [InventoryController::class, 'index']);

    Route::get('/production/results', [\App\Http\Controllers\ProductionController::class, 'results']);
    Route::post('/production/results', [\App\Http\Controllers\ProductionController::class, 'storeResult']);
    Route::delete('/production/results/{id}', [\App\Http\Controllers\ProductionController::class, 'destroyResult']);

    Route::apiResource('transfers', \App\Http\Controllers\TransferController::class);
    Route::apiResource('partners', \App\Http\Controllers\PartnerController::class);
    Route::get('/dashboard-sales', [\App\Http\Controllers\SalesTransactionController::class, 'salesDashboard']);
    Route::post('/sales-transactions/past-piutang', [\App\Http\Controllers\SalesTransactionController::class, 'storePastPiutang']);
    Route::post('sales-transactions/{id}/pay', [\App\Http\Controllers\SalesTransactionController::class, 'pay']);
    Route::apiResource('sales-transactions', \App\Http\Controllers\SalesTransactionController::class);
    Route::get('/my-stock', [\App\Http\Controllers\SalesTransactionController::class, 'myStock']);

    Route::apiResource('users', UserController::class);
    Route::apiResource('unit-conversions', UnitConversionController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('units', UnitController::class);
    Route::apiResource('recipes', \App\Http\Controllers\RecipeController::class);
});
