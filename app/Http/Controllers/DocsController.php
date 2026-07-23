<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class DocsController extends Controller
{
    public function show(): Response
    {
        $markdown = File::get(base_path('docs/OVERVIEW.md'));

        return Inertia::render('docs/overview', [
            'markdown' => $markdown,
        ]);
    }

    public function api(): Response
    {
        return Inertia::render('docs/api', [
            'baseUrl' => rtrim((string) config('app.url'), '/').'/api',
            'appUrl' => rtrim((string) config('app.url'), '/'),
        ]);
    }
}
