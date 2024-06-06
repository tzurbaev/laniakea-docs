# Resource Filters

Filters are tools for narrowing down the list of resources. They can be very simple – just pushing a criterion to
criteria list – or more complex, like performing some checks before applying the filter.

You can register as many filters as you need, but they won't be invoked unless there's a query parameter with the same name.

## Defining filters

A list of available filters must be returned from resource's `getFilters()` method.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Resources\Filters\UserEmailFilter;
use App\Resources\Filters\UserNameFilter;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;

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
        ];
    }
}
```

Filter name is defined by array key. This name will be used in API URLs for your resource. For example, URL for list 
of users filtered by email might look like this: <nobr>`https://example.org/users?email=hello`</nobr>.

## Creating filter

All resource filters must implement the `Laniakea\Resources\Interfaces\ResourceFilterInterface` interface:

```php
<?php

declare(strict_types=1);

namespace App\Resources\Filters;

use App\Repositories\Criteria\WhereLikeCriterion;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;

class UserEmailFilter implements ResourceFilterInterface
{
    public function apply(RepositoryQueryBuilderInterface $query, mixed $value, array $values): void
    {
        $query->addCriteria([
            new WhereLikeCriterion('email', $value),
        ]);
    }
}
```

## Query builder

The `apply` method's **first argument** is an instance of `Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface`.

You can use the `addCriteria()` method of `RepositoryQueryBuilderInterface` to add [criteria](/repositories/criteria) to the query.

```php
$query->addCriteria([
    new WhereLikeCriterion('email', $value),
]);
```

:::warning
While it allows performing multiple operations on a query (such as loading relationships via the 
[`with`](/repositories#with) method or applying sorting via the [`orderBy`](/repositories#orderBy) method), it's 
strongly recommended to use it only for filtering purposes (only in filters, of course. You are free to use other 
methods in non-filter contexts).
:::

More about query builder and criteria you can find in the [Repositories](/repositories) section.

### Eloquent Builder

If you don't want to use criteria in filters and instead want to work with Eloquent's query builder, use the
`getQueryBuilder()` method of `RepositoryQueryBuilderInterface` instance.

```php
<?php

declare(strict_types=1);

namespace App\Resources\Filters;

use App\Repositories\Criteria\WhereLikeCriterion;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;

class UserEmailFilter implements ResourceFilterInterface
{
    public function apply(RepositoryQueryBuilderInterface $query, mixed $value, array $values): void
    {
        $query->getQueryBuilder()->where('email', 'like', $value.'%');
    }
}
```

## Filter falue

The **second argument** is the value of the filter. It is a user-provided value, so you might want to validate it before
applying the filter.

::: tip
Even if requested URL has empty filter (when query string is like `?filter=`), the filter class still will be invoked.
Check for empty value before applying your filter.
Filters are not invoked when there is no query parameter with the same name.
:::

```php
<?php

declare(strict_types=1);

namespace App\Resources\Filters;

use App\Repositories\Criteria\WhereLikeCriterion;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;

class UserEmailFilter implements ResourceFilterInterface
{
    public function apply(RepositoryQueryBuilderInterface $query, mixed $value, array $values): void
    {
        if (empty($value)) {
            throw new \InvalidArgumentException('Email filter value cannot be empty.');
        }

        $query->addCriteria([
            new WhereLikeCriterion('email', $value),
        ]);
    }
}
```

## Other values

The **third argument** is the array of all filter values. It can be useful when you need to apply a filter based on
other filters' value.

::: tip
`$values` variable contains only values for registered filters that were provided by the user.

For example, if you have two filters – `name` and `email` – and user requested URL like <nobr>`?name=John`</nobr>, then
`$values` will contain only `name` filter value. On the other hand, if the URL is <nobr>`?name=John&role=user`</nobr>, then
`$values` will also contain only `name` value, since `role` is not a registered filter.
:::

```php
<?php

declare(strict_types=1);

namespace App\Resources\Filters;

use App\Repositories\Criteria\WhereLikeCriterion;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceFilterInterface;

class UserEmailFilter implements ResourceFilterInterface
{
    public function apply(RepositoryQueryBuilderInterface $query, mixed $value, array $values): void
    {
        if (empty($value)) {
            throw new \InvalidArgumentException('Email filter value cannot be empty.');
        } elseif (empty($values['name'])) {
            throw new \InvalidArgumentException('Email filter can be used only with name filter.');
        }

        $query->addCriteria([
            new WhereLikeCriterion('email', $value),
        ]);
    }
}
```

## Default filter values

If you need default values for filters (when there's no filter value provided by user), you can define them on
your **resource class** by implementing the `Laniakea\Resources\Interfaces\HasDefaultFilterValuesInterface` interface.

THe `getDefaultFilterValues()` method must return an array, where the array key is filter name and array value is
filter value.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Resources\Filters\UserRoleFilter;
use Laniakea\Resources\Interfaces\HasDefaultFilterValuesInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;

class UsersResource implements ResourceInterface, HasDefaultInclusionsInterface
{
    public function getFilters(): array
    {
        return [
            'role' => new UserRoleFilter(),
        ];
    }
    
    public function getDefaultFilterValues(): array
    {
        return ['role' => 'user'];
    }
}
```

In this example, if there's no user-provided filters, [Resource Manager](/resources/manager) will apply
`UserRoleFilter` with value of `user`.

:::tip
Default filter values are used only if there's not user-provided filter values. If there's at least one user filter,
the default values won't be used.
:::
