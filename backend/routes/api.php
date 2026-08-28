<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BidController;

Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/products/{product}/bids', [BidController::class, 'store']);