# Repository Criteria

Repository criteria allow you to apply reusable query conditions to your repository queries. Criteria are classes that
implement the `Laniakea\Repositories\Interfaces\RepositoryCriterionInterface` and can be added to the query using the
`addCriteria()` method of the `Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface`.

## Creating criterions {#create}

To create a new criterion, you need to create a new class that implements the
`Laniakea\Repositories\Interfaces\RepositoryCriterionInterface`. Its `apply()` method will be called when the criterion is
added to the query.

```php
<?php

declare(strict_types=1);

namespace App\Repositories\Criteria;

use Illuminate\Database\Eloquent\Builder;
use Laniakea\Repositories\Interfaces\RepositoryCriterionInterface;

readonly class UserRoleCriterion implements RepositoryCriterionInterface
{
    public function __construct(private string $role)
    {
        //
    }

    public function apply(Builder $query): void
    {
        $query->where('role', $this->role);
    }
}
```

In the `apply()` method you'll have access to the Eloquent's `Illuminate\Database\Eloquent\Builder` instance,
which you can use to apply the query conditions.

Please note, that unlike [resource filters](/resources/filters), criteria don't have any user-provided values.
Instead, you should specify them via criterion constructor arguments. Of course, if your criterion is very specific
and does not require any arguments, you can omit the constructor and apply the conditions directly in the `apply()` method.

```php
<?php

declare(strict_types=1);

namespace App\Repositories\Criteria;

use Illuminate\Database\Eloquent\Builder;
use Laniakea\Repositories\Interfaces\RepositoryCriterionInterface;

readonly class OnlyActiveUsersCriterion implements RepositoryCriterionInterface
{
    public function apply(Builder $query): void
    {
        // This criterion only selects users that have been active in the last week.
        $query->where('last_logged_in', '>=', now()->subWeek());
    }
}
```

:::warning
While you have the full control of the `Builder` instance and can use it however you like, it is recommended to use
criteria only for filtering purposes.

For example, if you want to load relationships, use the [`with()`](/repositories#with) method of the `RepositoryQueryBuilderInterface` instance,
or [`orderBy()`](/repositories#orderBy) method for sorting. You can find more about query builder in the
[Repositories](/repositories) section.
:::

## Applying criteria {#apply}

You can apply any number of criteria to your repositories using the `RepositoryQueryBuilderInterface`'s `addCriteria()` method.

The `RepositoryQueryBuilderInterface` is available in the callbacks of the [`first()`](/repositories#first),
[`firstOrFail()`](/repositories#firstOrFail), [`list()`](/repositories#list), and [`paginate()`](/repositories#paginate) methods
of your repositories.

It is also available in the callbacks of the [`getPaginator()`](/resources/manager#getPaginator)
and [`getList()`](/resources/manager#getList) methods of the [Resource Manager](/resources/manager).

```php
$repository = app(UsersRepository::class);
$activeUsers = $repository->list(function (RepositoryQueryBuilderInterface $query) {
    $query->addCriteria([
        new OnlyActiveUsersCriterion(),
    ]);
});
```

## Passing arguments {#arguments}

If your criterion requires additional arguments, you can pass them in the constructor when creating the criterion instance.
For example, you can get required user role from the HTTP Request and then pass it to `UserRoleCriterion`'s constructor.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\Criteria\UserRoleCriterion;
use App\Repositories\UsersRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;

class UsersApiController
{
    public function index(Request $request, UsersRepository $repository): JsonResponse
    {
        $users = $repository->list(function (RepositoryQueryBuilderInterface $query) use ($request) {
            $query->addCriteria([
                new UserRoleCriterion($request->input('role', 'user')),
            ]);
        });

        return response()->json($users);
    }
}
```
