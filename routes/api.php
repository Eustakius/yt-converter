<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\YouTubeController;

Route::get('/info', [YouTubeController::class, 'info']);
Route::get('/download', [YouTubeController::class, 'download']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
