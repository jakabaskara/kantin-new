<?php

use Inertia\Testing\AssertableInertia as Assert;

test('api documentation page is rendered with base url', function () {
    $this->get(route('docs.api'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('docs/api')
            ->has('baseUrl')
            ->has('appUrl')
            ->where('baseUrl', rtrim((string) config('app.url'), '/').'/api')
        );
});
