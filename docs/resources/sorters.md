# Sorters

Sorters are responsible for (surprise) sorting resources. A resource can have primitive sorters, which sort by
a single column, or more complex sorters, which can join tables before sorting and then sort by a joined table's column.

## Defining sorters

A list of available sorters must be returned from resource's `getSorters()` method.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Laniakea\Resources\Interfaces\ResourceInterface;
use Laniakea\Resources\Interfaces\ResourceSorterInterface;
use Laniakea\Resources\Sorters\ColumnSorter;
use Laniakea\Resources\Sorters\VirtualColumnSorter;

class UsersResource implements ResourceInterface
{
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

Sorter name is defined by array key. This name will be used as value for `order_by` parameter in URL. For example,
URL with sorting by the `registered_at` sorter might look like this: <nobr>`https://example.org/users?order_by=registered_at`</nobr>.

## Included sorters

Laniakea provides two sorters that you can use for simple sorting. First one is `Laniakea\Resources\Sorters\ColumnSorter`,
which simply sorts by the database column name. The column is defined by the array key of `getSorters()` method.

The second one is `Laniakea\Resources\Sorters\VirtualColumnSorter`. It might be useful, if you don't want to expose
some database column names to public APIs. In the example above, the `registered_at` sorter actually sorts by the
`created_at` database column (pass the required column name as first argument of `VirtualColumnSorter`'s constructor).

## Creating sorters

All resource sorters must implement the `Laniakea\Resources\Interfaces\ResourceSorterInterface` interface:

```php
<?php

declare(strict_types=1);

namespace App\Resources\Sorters;

use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;
use Laniakea\Resources\Interfaces\ResourceSorterInterface;

class BackwardsEmailSorter implements ResourceSorterInterface
{
    public function sort(RepositoryQueryBuilderInterface $query, string $column, string $direction): void
    {
        $query->orderBy('email', $direction === 'asc' ? 'desc' : 'asc');
    }
}
```

## Query Builder

The `sort` method's **first argument** is an instance of `Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface`.

You can use the `orderBy()` method of `RepositoryQueryBuilderInterface` to add criteria to the query.

```php
$query->orderBy('email', $direction === 'asc' ? 'desc' : 'asc');
```

::: warning
While it allows performing multiple operations on a query (such as loading relationships via the `with` method or adding
criteria via the `addCriteria` method), it is strongly recommended to use it only for sorting purposes (only in sorters,
of course. You are free to use other methods in non-sorter contexts).
:::

## Column

The **second argument** is the column to sort by. It matches the sorter name (array key of `getSorters()` method).

## Direction

The **third argument** is the direction of sorting. It can be either `asc` for ascending order or `desc` for descending
order (always in lower case, if default [`ResourceRequest`](/resources/requests) is used).

The direction value is managed by [`ResourceRequest`](/resources/requests) instance.

## Default sorting

If your resource needs some default sorting (if there's no user-provided sorting), you can implement the 
`Laniakea\Shared\Interfaces\HasDefaultSortingInterface` interface on your **resource class**.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Laniakea\Resources\Interfaces\ResourceInterface;
use Laniakea\Resources\Interfaces\ResourceSorterInterface;
use Laniakea\Resources\Sorters\ColumnSorter;
use Laniakea\Resources\Sorters\VirtualColumnSorter;
use Laniakea\Shared\Interfaces\HasDefaultSortingInterface;

class UsersResource implements ResourceInterface, HasDefaultSortingInterface
{
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

    /**
     * Get default sorting column.
     *
     * @return string
     */
    public function getDefaultSortingColumn(): string
    {
        return 'registered_at';
    }

    /**
     * Get default sorting direction.
     *
     * @return string
     */
    public function getDefaultSortingDirection(): string
    {
        return 'desc';
    }
}
```

The `getDefaultSortingColumn()` must return sorter name (matches some of the array key from the `getSorters()` method).
The `getDefaultSortingDirection()` must return default sorting direction (`asc` or `desc`).

:::tip
Default sorting works only if there's not user-requested sorting.
:::
