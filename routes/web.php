<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
    return view('welcome');
})->where('any', '^(?!api|sanctum|up).*$');
