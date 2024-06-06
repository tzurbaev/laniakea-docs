# Exceptions

Several internal methods of Laniakea uses `Laniakea\Exceptions\BaseHttpException` (and its subclasses) to report
unrecoverable errors. Those exceptions are designed to be rendered with a specific JSON schema and are not intended to
be reported as regular exceptions.

## Features

`BaseHttpException` and Laniakea's exceptions renderer offers few advantages that might be useful for your project:

- It renders exceptions with a consistent JSON schema (see example below);
- It can have translations for error messages;
- It supports JSON responses and View-based responses;
- It has a `Illuminate\Validation\ValidationException` wrapper and rendering method so validation exceptions can be
rendered in the same JSON format as other exceptions;
- You can define custom metadata and HTTP headers per exception.

## Reporting and rendering

You can disable reporting for these exceptions and render them in the package-intended format by using Laravel bootstrap's
`withExceptions()` method.

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

        // Optionally: render Laravel's ValidationException with Laniakea's renderer (see below).
        $exceptions->renderable(fn (ValidationException $e, Request $request) => $renderer->renderValidationException($e, $request));
    })->create();
```

The `render()` method of `Laniakea\Exceptions\ExceptionRenderer` will render the exception in the following format:

```json
{
  "error": {
    "message": "Product was not found.",
    "original_message": "Product was not found.",
    "code": "products.not_found",
    "meta": []
  }
}
```

## Validation exceptions

By default Laravel's `Illuminate\Validation\ValidationException` renders like this:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": [
      "The name is requried"
    ]
  }
}
```

If you want to render it with Laniakea's renderer, you can use the `renderValidationException()` method of
`Laniakea\Exceptions\ExceptionRenderer`:

```php
use Illuminate\Validation\ValidationException;

$exceptions->renderable(fn (ValidationException $e, Request $request) => $renderer->renderValidationException($e, $request));
```

This method will wrap your `ValidationException` with `Laniakea\Exceptions\ValidationException` and render it like this:

```json
{
  "error": {
    "message": "The given data was invalid.",
    "original_message": "The given data was invalid.",
    "code": "validation.failed",
    "meta": {
      "errors": {
        "name": ["The name is requried"]
      }
    }
  }
}
```

Notice how it matches other exceptions format and also provides list of errors in a `meta` key.

::: tip
`ValidationException` wrapper will be used only if the request expects JSON response (i.e. `Accept: application/json` header is present).

Otherwise it will fallback to Laravel's default rendering (or your custom-defined rendering).
:::

## Creating exceptions

If you want to create new exceptions that should be rendered with Laniakea's renderer, you can extend the
`Laniakea\Exceptions\BaseHttpException` class and override three constants:

- `public const MESSAGE` – the default message of the exception;
- `public const ERROR_CODE` – string-based error code with dot notation support. This error code can also be used as translation key;
- `public const HTTP_CODE` – the HTTP status code of the exception.

Here is an example of a custom exception:

```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Laniakea\Exceptions\BaseHttpException;

class UserNotFoundException extends BaseHttpException
{
    public const MESSAGE = 'User was not found.';
    public const ERROR_CODE = 'users.not_found';
    public const HTTP_CODE = 404;
}
```

Now you can throw this exception in your code and it will be rendered with the same format as other Laniakea exceptions.

```json
{
  "error": {
    "message": "User was not found.",
    "original_message": "User was not found.",
    "code": "users.not_found",
    "meta": []
  }
}
```

## Override default message

When you throw an exception, you can override the default message by passing a string as the first argument of the
exception constructor:

```php
<?php

use App\Exceptions\UserNotFoundException;

throw new UserNotFoundException('User with ID 123 was not found.');
```

## Specify metadata

Use the `addMeta()` method to add metadata to the exception:

```php
<?php

use App\Exceptions\UserNotFoundException;

throw (new UserNotFoundException())->addMeta(['user_id' => 123]);
```

To override all previously set metadata, use the `setMeta()` method:

```php
<?php

use App\Exceptions\UserNotFoundException;

throw (new UserNotFoundException())->setMeta(['user_id' => 123]);
```

## HTTP headers

If you need to send response with custom HTTP headers, you can use the `addHeaders()` method:

```php
<?php

use App\Exceptions\UserNotFoundException;

throw (new UserNotFoundException())->addHeaders([
    'X-Error-Identifier' => '5a8e4ef9-3e26-4693-9574-a655361e18bb',
]);
```

To override all previously set headers, use the `setHeaders()` method:

```php
<?php

use App\Exceptions\UserNotFoundException;

throw (new UserNotFoundException())->setHeaders([
    'X-Error-Identifier' => '5a8e4ef9-3e26-4693-9574-a655361e18bb',
]);
```

## Message translations

If your application supports multiple languages, you can use Laravel's translation system to provide localized error
messages along with error message in English (or any other language that was used to describe `MESSAGE` constant).

By default, Laniakea's exception renderer will use error code (`ERROR_CODE` constant) as a part of translation key.
It uses `exceptions.` as namespace and `.message` as final translation segment.

For example, if your error code is `users.not_found`, the translation key will be `exceptions.users.not_found.message`.
That means, that Laravel's translation system will look for a translation in `lang/<locale>/exceptions.php` file
(where `<locale>` is the current locale of the application):

```php
<?php

return [
    'users' => [
        'not_found' => ['message' => 'Пользователь не найден.'],
    ],
];
```

If you're OK with described translation paths, there's no need to do anything else. Simply add translations to your
`lang/<locale>/exceptions.php` file. The translated message will be placed under `message` key in the JSON response
while original message will be placed under `original_message` key.


```json
{
  "error": {
    "message": "Пользователь не найден.",
    "original_message": "User was not found.",
    "code": "users.not_found",
    "meta": []
  }
}
```

::: tip
Translated message has a higher priority than the original message. Even if you override the default message with constructor
argument, translated message will be used if it's available.
:::

### Replacements

Any metadata that you set with `addMeta()` or `setMeta()` can be used as replacements in the translated message.
For example, you can use `:user_id` in the translation string and it will be replaced with the actual value of the
`user_id` key from the metadata.

::: code-group
```php [example.php]
<?php

use App\Exceptions\UserNotFoundException;

throw (new UserNotFoundException())->setMeta(['user_id' => 123]);
```
```php [exceptions.php]
<?php

return [
    'users' => [
        'not_found' => ['message' => 'Пользователь с ID :user_id не найден.'],
    ],
];
```
```json [response.json]
{
  "error": {
    "message": "Пользователь с ID 123 не найден.",
    "original_message": "User was not found.",
    "code": "users.not_found",
    "meta": {
      "user_id": 123
    }
  }
}
```
:::

### Use custom translation namespace

If you don't want to use `exceptions.` as a namespace, you can override the `getTranslationNamespace()` method in your
exception class:

```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Laniakea\Exceptions\BaseHttpException;

class UserNotFoundException extends BaseHttpException
{
    public const MESSAGE = 'User was not found.';
    public const ERROR_CODE = 'users.not_found';
    public const HTTP_CODE = 404;

    protected function getTranslationNamespace(): string
    {
        return 'users.exceptions.';
    }
}
```

Now the translation key will be `users.exceptions.users.not_found.message`.

::: tip
Do not forget to add trailing dot (`.`) to the namespace string.
:::

### Use custom translation path

If you want to override full translation path for a specific exception, you can override the `getTranslationPath()` method:

```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Laniakea\Exceptions\BaseHttpException;

class UserNotFoundException extends BaseHttpException
{
    public const MESSAGE = 'User was not found.';
    public const ERROR_CODE = 'users.not_found';
    public const HTTP_CODE = 404;

    protected function getTranslationPath(): string
    {
        return 'users.errors.not_found';
    }
}
```

### Why the `.message` suffix?

The `.message` suffix allows you to have nested error codes for similar exceptions. For example, you can have
`users.not_found` error code (with translation key of `users.not_found.message`) and `users.not_found.email` error code
(with translation key of `users.not_found.email.message`).

```php
<?php

return [
    'users' => [
        'not_found' => [
            'message' => 'Пользователь с ID :user_id не найден.',
            'email' => ['message' => 'Пользователь с таким email не найден.'],
        ],
    ],
];
```

## Render exceptions as views

If you want to render exceptions as well, you can implement the `Laniakea\Exceptions\RenderableExceptionInterface`
interface on your exception class and return instance of `Illuminate\View\View` from the `getView()` method.

```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Laniakea\Exceptions\BaseHttpException;
use Laniakea\Exceptions\RenderableExceptionInterface;

class UserNotFoundException extends BaseHttpException implements RenderableExceptionInterface
{
    public const MESSAGE = 'User was not found.';
    public const ERROR_CODE = 'users.not_found';
    public const HTTP_CODE = 404;

    public function getView(Request $request): View
    {
        return view('users.errors.not_found', [
            'message' => $this->getErrorMessage(),
            'metaData' => $this->getMeta(),
        ]);
    }
}
```
