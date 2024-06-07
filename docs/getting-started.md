# Getting Started

Laniakea is a package for the [Laravel Framework](https://laravel.com), utilizing many of Laravel's features.

Make sure you have a Laravel `^10.0|^11.0` project set up and running on PHP `^8.2`.

While it's entirely possible to use Laniakea in existing projects, it is recommended to start a new project to
experiment with the package.

## Installation

You can install the package via Composer:

```bash
composer require laniakea/laniakea
```

Laniakea uses a configuration file to store your [resource registrars](/resources/registrars), resource settings, and
class bindings. Publish the configuration file with the following command:

```bash
php artisan vendor:publish --provider="Laniakea\LaniakeaServiceProvider"
```

## Configuration

Please refer to the [configuration](/configuration) section for more information on how to configure the package.

## Middleware {#middleware}

Laniakea has two middleware that you might need to use in your project.

### `SetResourceRequest`

The first one is `Laniakea\Resources\Middleware\SetResourceRequest`. It binds an `Laniakea\Resources\Interfaces\ResourceRequestInterface`
instance to the Laravel's [Service Container](https://laravel.com/docs/container) for the current request.

This middleware is required for all routes that are going to use
`Laniakea\Resources\Interfaces\ResourceManagerInterface`. Essentially, you'll want to attach this middleware to all
your API routes that are managed by Laniakea resources.

::: warning
Even if you're not using `ResourceManagerInterface` directly, it still can be invoked in [route model bindings](/resources/registrars).
Attach this middleware to all routes that might use model bindings (even non-API routes).
:::

### `SetApiVersion` {#SetApiVersion}

The second one is `Laniakea\Versions\Middleware\SetApiVersion`. It binds an `Laniakea\Versions\Interfaces\ApiVersionInterface`
instance to the Service Container and is required if you're going to use API versioning.

For more information on API versioning, please refer to the [API Versions](/resources/versions) section.

### Register Middleware {#register-middleware}

You can register both middleware in your `bootstrap/app.php` file.

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laniakea\Resources\Middleware\SetResourceRequest;
use Laniakea\Versions\Middleware\SetApiVersion;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register aliases for Laniakea middleware. 
        $middleware->alias([
            'laniakea.request' => SetResourceRequest::class,
            'laniakea.version' => SetApiVersion::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

::: warning
Both middleware must be executed before Laravel's `Illuminate\Routing\Middleware\SubstituteBindings` middleware.
Check [Middleware Priority](#middleware-priority) section below for more info.
:::

Now both middleware are registered, and you can use them in your routes.

The `SetApiVersion` middleware requires a version as its parameter: `laniakea.version:v1`.
It will bind the `ApiVersionInterface` instance with the name `v1`, so calling `getName()` will return `v1`:

```php

use Laniakea\Versions\Interfaces\ApiVersionInterface;

$version = app(ApiVersionInterface::class)->getName(); // $version in 'v1'.
```

### Use Middleware

You can use both middleware in your routes like this:

```php
<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::group(['middleware' => ['laniakea.request']], function () {
    Route::group(['/prefix' => '/v1', 'middleware' => ['laniakea.version:v1']], function () {
        // V1 routes
    });

    Route::group(['/prefix' => '/v2', 'middleware' => ['laniakea.version:v2']], function () {
        // V2 routes
    });
    
    // Routes without versioning
});
```

### Middleware Priority {#middleware-priority}

Both `SetResourceRequest` and `SetApiVersion` middleware must be executed before the Laravel's
`Illuminate\Routing\Middleware\SubstituteBindings` middleware. Check out Laravel documentation on
[middleware priority](https://laravel.com/docs/middleware#sorting-middleware).

Additionally, you can use [laniakea/middleware-priority](https://github.com/tzurbaev/laravel-middleware-priority) package
to set middleware priority:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Laniakea\MiddlewarePriority\MiddlewarePriorityManager;
use Laniakea\Resources\Middleware\SetResourceRequest;
use Laniakea\Versions\Middleware\SetApiVersion;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register aliases for Laniakea middleware.
        $middleware->alias([
            'laniakea.request' => SetResourceRequest::class,
            'laniakea.version' => SetApiVersion::class,
        ]);

        // Create fresh middleware priority manager with default middleware priority.
        $manager = MiddlewarePriorityManager::withDefaults($middleware);

        // Place SetResourceRequest and SetApiVersion middleware before SubstituteBindings middleware.
        $manager->before(SubstituteBindings::class, [
            SetResourceRequest::class, 
            SetApiVersion::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

## Exceptions

Even if you don't plan to use [Laniakea exceptions](/exceptions) in your project, some Laniakea classes throws them in
case of errors. You might want to disable reporting for such exceptions and render them in the package-intended format.

Use the Laravel bootstrap's `withExceptions()` method to handle this:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laniakea\Exceptions\BaseHttpException;
use Laniakea\Exceptions\ExceptionRenderer;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        /** @var ExceptionRenderer $renderer */
        $renderer = app(ExceptionRenderer::class);

        // Disable reporting for all Lanikea exceptions.
        $exceptions->dontReport(BaseHttpException::class);

        // Allow Laniakea's ExceptionRenderer render base exceptions
        $exceptions->renderable(fn (BaseHttpException $e, Request $request) => $renderer->render($e, $request));

        // Optionally: render Laravel's ValidationException with Laniakea's renderer.
        $exceptions->renderable(fn (ValidationException $e, Request $request) => $renderer->renderValidationException($e, $request));
    })->create();
```

Please refer to the [exceptions](/exceptions) section for more information on how to use Laniakea exceptions.

## Usage

Now you're ready to [create your first resource](/resources).

## Demo application

If you want to see Laniakea in action, check out the [Laravel 11 demo application](https://github.com/tzurbaev/laniakea-demo)
that uses all features of Laniakea – including [resources](/resources), [repositories](/repositories),
[API versioning](/resources/versions), [model settings](/settings) and [forms](/forms).
