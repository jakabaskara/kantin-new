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
}
