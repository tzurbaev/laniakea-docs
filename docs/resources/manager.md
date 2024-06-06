# Resource Manager

Resource Manager stitches your [resource](/resources), [repository](/repositories), and [resource request](/resources/requests)
together and performs all required logic to retrieve, filter, sort, paginate, and load relationships for your resources.

## Using the resource manager

In most cases you'll work with resource manager inside your API controllers. Inject the instance of
`Laniakea\Resources\Interfaces\ResourceManagerInterface` interface into your controller method and use it for
paginating or listing resources.

Both `getPaginator()` and `getList()` methods of `ResourceManagerInterface` accepts the following arguments:

1. `$request` – instance of `Laniakea\Resources\Interfaces\ResourceRequestInterface`;
2. `$resource` – instance of `Laniakea\Resources\Interfaces\ResourceInterface`;
3. `$repository` – instance of `Laniakea\Repositories\Interfaces\RepositoryInterface`;
4. `$callback` – optional callback with access to the `Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface` instance;
5. `$context` – an array of additional context that can be used inside filters and sorters.

Let's see simple example of how it works. Check the `UsersResource.php` for resource definition.

::: code-group

```php [UsersApiController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\Criteria\OnlyActiveUsersCriterion;
use App\Repositories\UsersRepository;
use App\Resources\UsersResource;
use Illuminate\Http\JsonResponse;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceManagerInterface;
use Laniakea\Resources\Interfaces\ResourceRequestInterface;

class UsersApiController
{
    public function index(ResourceRequestInterface $request, ResourceManagerInterface $manager): JsonResponse
    {
        $paginator = $manager->getPaginator(
            request: $request,
            resource: new UsersResource(),
            repository: new UsersRepository(),
            callback: fn (RepositoryQueryBuilderInterface $query) => $query->addCriteria([
                new OnlyActiveUsersCriterion(),
            ]),
        );

        return response()->json($paginator);
    }
}
```

```php [UsersResource.php]
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Resources\Filters\UserEmailFilter;
use App\Resources\Filters\UserNameFilter;
use App\Resources\Filters\UserRoleFilter;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;
use Laniakea\Resources\Interfaces\ResourceSorterInterface;
use Laniakea\Resources\Sorters\ColumnSorter;
use Laniakea\Resources\Sorters\VirtualColumnSorter;

class UsersResource implements ResourceInterface
{
    /**
     * Get available resource filters list.
     *
     * @return array<string, ResourceFilterInterface|string>
     */
    public function getFilters(): array
    {
        return [
            'name' => new UserNameFilter(),
            'email' => new UserEmailFilter(),
            'role' => new UserRoleFilter(),
        ];
    }

    /**
     * Get available inclusions list.
     *
     * @return array<string, string[]>
     */
    public function getInclusions(): array
    {
        return [
            'posts' => ['posts'],
            'posts.comments' => ['posts.comments'],
            'avatar' => ['media'],
        ];
    }

    /**
     * Get available sorters list.
     *
     * @return array<string, ResourceSorterInterface>
     */
    public function getSorters(): array
    {
        return [
            'id' => new ColumnSorter(),
            'registered_at' => new VirtualColumnSorter('created_at'),
        ];
    }
}
```

```php [UsersRepository.php]
<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use Laniakea\Repositories\AbstractRepository;

class UsersRepository extends AbstractRepository
{
    /**
     * Get repository model class name.
     *
     * @return string
     */
    protected function getModel(): string
    {
        return User::class;
    }
}
```
:::

In this example you'll get instance of `LengthAwarePaginator` with paginated and filtered users data. It also
applies `OnlyActiveUsersCriterion` criterion to the query builder, making sure only active users are returned.

Notice how there's no filters, sorters, or relationships-related logic in the controller. All of this is handled by
the resource manager.

## Filtering resources

Let's assume that this controller is responsible for the `https://example.org/users` route. With this default URL
you'll get paginated response of first 15 users by default. There will be no filtering (except the static
`OnlyActiveUsersCriterion` criterion) or sorting applied and users won't have any relationships.

But how to filter users by name, email, or role? You can use query parameters for that. For example, to get only
users with name starting with "John" you can use <nobr>`https://example.org/users?name=John`</nobr>. Or to get users with role
"admin" you can use <nobr>`https://example.org/users?role=admin`</nobr>.

Of course, you can use multiple filters at once. For example, to get users with name starting with "John" and role
"admin" you can use <nobr>`https://example.org/users?name=John&role=admin`</nobr>.

::: tip
All filters are applied using `AND` operator. This means that all filters should match for the record to be included in
the result set.
:::

## Loading relationships

To load relationships you can use `with` query parameter. For example, to load user's posts you can use
the following URL: <nobr>`https://example.org/users?with=posts`</nobr>.

It's also possible to load nested relationships. For example, to load user's posts and comments you can use
the following URL: <nobr>`https://example.org/users?with=posts.comments`</nobr>.

::: tip
If you're loading nested relationships, there's no need in loading parent relationships. For example,
`posts` inclusion is not required when loading `posts.comments`.

However, even if `posts` provided along with `posts.comments`, it won't trigger any errors or additional queries – Laravel
handles it behind the scenes.
:::

Separate inclusions with comma to load multiple relationships. For example, to load user's posts and avatar you can use
the following URL: <nobr>`https://example.org/users?with=posts.comments,avatar`</nobr>.

## Sorting models

To sort models you can use `order_by` query parameter. For example, to sort users by name in ascending order you can use
the following URL: <nobr>`https://example.org/users?order_by=name`</nobr>.

To sort users by name in descending order add minus sign (`-`) before the column name: <nobr>`https://example.org/users?order_by=-name`</nobr>.

## Specify page and count per page

To specify page number and count of records per page you can use `page` and `count` query parameters. For example,
to get second page with 10 users per page you can use the following URL: <nobr>`https://example.org/users?page=2&count=10`</nobr>.

## Changing field names

If you're not happy with the field names (`with`, `order_by`, `page`, `count`) you can change them in the
[configuration file](/configuration). This does not apply to filter names, since they're defined in the resource class.

However, you can extend and tweak `ResourceRequest` class to change how filters are retrieved from the request.

```php
<?php

declare(strict_types=1);

namespace App\Resources\Requests;

use Illuminate\Support\Arr;
use Laniakea\Resources\Requests\ResourceRequest;

class CustomizedResourceRequest extends ResourceRequest
{
    /**
     * Get filter values (limited to provided keys).
     *
     * @param array $filters
     *
     * @return array
     */
    public function getFilters(array $filters): array
    {
        $values = $this->getRequest()->input('filters');

        return is_array($values) ? Arr::only($values, $filters) : [];
    }
}
```

In this example it's assumed that all filters provided within the single `filters` query parameter. So URL for
filtering users by name starting with "John" and role "admin" would look like this: <nobr>`https://example.org/users?filters[name]=John&filters[role]=admin`</nobr>.

::: tip
In order for this to work, make sure that you provide your modified class to the resource manager (instead of the default `ResourceRequestInterface`).
:::

## Loading single model

The `ResourcesManagerInterface` provides a `getItem` method, which can be used to load single model from the database.
This method accepts similar arguments as `getPaginator` and `getList` methods, but returns single model instance instead
(by the `id` argument).

If there's no model with given ID, `ModelNotFoundException` will be thrown.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Repositories\UsersRepository;
use App\Resources\UsersResource;
use Illuminate\Http\JsonResponse;
use Laniakea\Resources\Interfaces\ResourceManagerInterface;
use Laniakea\Resources\Interfaces\ResourceRequestInterface;

class UsersApiController
{
    public function show(int $id, ResourceRequestInterface $request, ResourceManagerInterface $manager): JsonResponse
    {
        /** @var User $user */
        $user = $manager->getItem(
            id: $id,
            request: $request,
            resource: new UsersResource(),
            repository: new UsersRepository(),
        );

        return response()->json($user);
    }
}
```

Since it's a single item response, the `getItem()` method does not apply any filtering or sorting, but it manages
relationships loading.

So, to load single user by ID with posts & comments relationships, the URL would look like this: <nobr>`https://example.org/users/1?with=posts.comments`</nobr>.

## Model route binding

Laravel provides a convenient way to load models by their primary key. This is called
[route model binding](https://laravel.com/docs/routing#route-model-binding).

When using route model binding, you can type-hint the model in the controller method and Laravel will automatically
inject the model instance that has an ID matching the corresponding value from the URL.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UsersApiController
{
    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }
}
```

But if you try to inject a Laniakea-managed resource model like this, there won't be any relationships loaded. This is
because Laravel does not know about the resource manager and its logic.

However, you can instruct Laravel how to handle these things. Check out the [Resource Registrars](/resources/registrars)
section to learn more about this.
