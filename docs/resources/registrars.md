# Resource Registras

Resource registrars allows you to use Laravel's [route model binding](https://laravel.com/docs/routing#route-model-binding)
feature with your resources.

Registrars also can be used to define API Version bindings for your services. Read more in [separate article](/resources/versions).

::: warning
Since route model bindings are resolved via `Laniakea\Resources\Interfaces\ResourceManagerInterface`, it is required
to attach the `Laniakea\Resources\Middleware\SetResourceRequest` middleware to all routes that are going to use
route model bindings.

[Learn more about middleware](/getting-started#middleware)
:::

## Creating registrars

All resource registrars must implement the `Laniakea\Resources\Interfaces\ResourceRegistrarInterface` interface.

```php
<?php

declare(strict_types=1);

namespace App\Resources\Registrars;

use App\Repositories\UsersRepository;
use App\Resources\UsersResource;
use Laniakea\Resources\Interfaces\ResourceRegistrarInterface;
use Laniakea\Resources\Interfaces\ResourceRouteBinderInterface;

class UsersRegistrar implements ResourceRegistrarInterface
{
    public function bindRoute(ResourceRouteBinderInterface $binder): void
    {
        $binder->bind('user', UsersResource::class, UsersRepository::class);
    }
}
```

In the `bindRoute()` method you should use the provided `Laniakea\Resources\Interfaces\ResourceRouteBinderInterface`
instance to bind your resource model to the router.

The first argument is the name of the route parameter, the second argument is the resource class name, and the third argument
is the repository class name.

## Setting the custom exception

By default, if there's no resource with the given ID, Laniakea will throw the 
`Illuminate\Database\Eloquent\ModelNotFoundException` exception. If you want to change it, provide the exception
class name (or instance of an exception class) as a fourth argument.

::: code-group
```php [UsersRegistrar.php]
<?php

declare(strict_types=1);

namespace App\Resources\Registrars;

use App\Exceptions\UserNotFoundException;
use App\Repositories\UsersRepository;
use App\Resources\UsersResource;
use Laniakea\Resources\Interfaces\ResourceRegistrarInterface;
use Laniakea\Resources\Interfaces\ResourceRouteBinderInterface;

class UsersRegistrar implements ResourceRegistrarInterface
{
    public function bindRoute(ResourceRouteBinderInterface $binder): void
    {
        $binder->bind(
            name: 'user',
            resource: UsersResource::class,
            repository: UsersRepository::class,
            notFoundException: UserNotFoundException::class,
        );
    }
}
```

```php [UserNotFoundException.php]
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Laniakea\Exceptions\BaseHttpException;

class UserNotFoundException extends BaseHttpException
{
    public const MESSAGE = 'User was not found.';
    public const ERROR_CODE = 'users.not_found';
}
```
:::

## Registering registrars

To register your resource registrar, you should add it to the `registrars` array of your `laniakea.php`
[configuration file](/configuration).

::: code-group
```php [config/laniakea.php]
<?php

return [
    'registrars' => [
        App\Resources\Registrars\UsersRegistrar::class,
    ],
];
```
:::

Now you can use route model binding with your users resource. Just make sure that you're using the same route parameter name,
as you've defined in the registrar.

::: code-group
```php [api.php]
<?php

declare(strict_types=1);

use App\Http\Controllers\UsersApiController;
use Illuminate\Support\Facades\Route;

Route::group(['middleware' => ['laniakea.request']], function () {
    Route::get(
      '/users/{user}',// [!code focus]
      [UsersApiController::class, 'show'],
    )->name('users.show');
});
```
```php [UsersApiController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UsersApiController
{
    public function show(User $user): JsonResponse
    {
        // If there's any requested relationship, it will be loaded automatically by Laniakea.

        return response()->json($user);
    }
}
```
:::
