# Resources

A resource can be either a synonym for your Eloquent model or a combination of the model itself, a resource class, 
repository, controllers, requests, transformers, actions, and versions.

The resource architecture is designed as follows:

1. There's an Eloquent model;
2. There's a [Repository](/repositories) that operates with the model;
3. There's a Resource that defines rules for [filtering](/resources/filters), [sorting](/resources/sorters), and 
managing Eloquent [relations](/resources/inclusions);
4. There's a Controller responsible for handling HTTP requests and responses;
5. There's a [Resource Manager](/resources/manager) that manages all data retrieval logic;
6. There may also be a Transformer that converts the model (or collection of models) into a response format.

## Creating a Resource class

All resource classes must implement the `Laniakea\Resources\Interfaces\ResourceInterface` interface. This interface
comprises three methods:

- `getFilters()` - returns an array of [filters](/resources/filters) applicable to the resource;
- `getInclusions()` - returns an array of [relations](/resources/inclusions) that can be included in the resource;
- `getSorters()` - returns an array of [sorters](/resources/sorters) applicable to the resource.

As seen in [introduction](/intro#api-resources), a simple resource class might resemble this:

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Resources\Filters\UserEmailFilter;
use App\Resources\Filters\UserNameFilter;
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

This resource supports several functionalities:
- Filtering users by name (`UserNameFilter`) and/or email (`UserEmailFilter`);
- Including user posts (`posts`) or posts with comments (`posts.comments`) in the API response;
- Sorting users by `id` and `registered_at` fields. The `registered_at` field is a virtual field mapped to the 
`created_at` field in the database.

Let's take a closer look at each of these features.

## Filters

Filters are tools for narrowing down the list of resources. They can range from simple operations, such as pushing a 
criterion to a criteria list, to more complex tasks like performing checks before applying the filter.

You can register as many filters as needed, but they won't be invoked unless there's a query parameter with the same name.

For example, if your resource has two filters (`name` and `email`), and the current request only includes the `email`
field in the query string, the `name` filter won't be triggered.

### Filter Names

The public name (or the name used in the query string) is defined by the array key in the `getFilters()` method.

In the above example, there are two filters: `name` and `email`. The query string for both filters would look like this:
`https://example.org/users?email=hello&name=John`.

In this case both filters will be triggered and applied to the resource. On the other hand, if the URL is `https://example.org/users?email=hello`,
only the `email` filter will be applied.

Learn more about writing your filters in a separate [section](/resources/filters).

## Inclusions

Inclusions are a means to include related resources in the response. They're defined in the `getInclusions()` method and
work as follows:

- The array key is the public name of the inclusion;
- The array value is an array of model relationships that should be included.

For example, if you have a `User` model that has many`Post` models (via the `posts` relationship), you can describe 
the `posts` inclusion and provide a list of model relationships that should be included.

The resource example above has three inclusions: `posts`, `posts.comments`, and `avatar`. The query string for these inclusions
would look like this: <nobr>`https://example.org/users?with=posts,posts.comments,avatar`</nobr>.

Learn more about how to define inclusions in a separate [section](/resources/inclusions).

## Sorters

Sorters are used to arrange (or order) the list of resources. They can be simple, just sorting by a column/direction, 
or more complex, such as joining tables before sorting and then sorting by the joined table's column.

The sorting column and sorting direction are defined by a single query string parameter (by default it's `order_by`).
Sort by ascending order is as simple as <nobr>`?order_by=registered_at`</nobr>. Append a minus sign to column name to
sort resources in descending order: <nobr>`?order_by=-registered_at`</nobr>.

Learn more about how to define inclusions in a separate [section](/resources/sorters).

## Item criterion {#item-criterion}

By default, the [Resource Manager](/resources/manager) utilizes the [`findOrFail`](/repositories#findOrFail) method of the
repository to retrieve a single resource.

For instance, when users request a single user by ID, the URL would resemble this: <nobr>`https://example.org/users/1`</nobr>.
Resource Manager will then invoke the `findOrFail` method of the repository with the ID of `1`.

If your item resolving strategy differs (for example, you might use the `uuid` table column and incorporate it into 
routes instead of auto-incrementing ID), you can define a custom [criterion](/repositories/criteria) for the Resource Manager.

Implement the `Laniakea\Resources\Interfaces\HasItemCriterionInterface` interface and return such a criterion from the
`getItemCriterion` method of the resource class.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Repositories\Criteria\ModelIdCriterion;
use Laniakea\Resources\Interfaces\HasItemCriterionInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;

class UsersResource implements ResourceInterface, HasItemCriterionInterface
{
    public function getItemCriterion(mixed $id): ModelIdCriterion
    {
        return new ModelIdCriterion($id);
    }
}
```

Let's assume you have a `User` model with a UUID column (`uuid`). The URL for the user with UUID
`87a92d50-fee1-4df5-8644-2a57881991fa` would be <nobr>`https://example.org/users/87a92d50-fee1-4df5-8644-2a57881991fa`</nobr>.

The `ModelIdCriterion` to retrieve such a user might resemble this:

```php
<?php

declare(strict_types=1);

namespace App\Repositories\Criteria;

use Illuminate\Database\Eloquent\Builder;
use Laniakea\Repositories\Interfaces\RepositoryCriterionInterface;

readonly class ModelIdCriterion implements RepositoryCriterionInterface
{
    public function __construct(private string $id)
    {
        //
    }

    public function apply(Builder $query): void
    {
        $query->where('uuid', $this->id);
    }
}
```

Instead of invoking the [`findOrFail()`](/repositories#findOrFail) method with UUID on `UsersRepository` class,
[Resource Manager](/resources/manager) will call [`firstOrFail()`](/repositories#firstOrFail) method and apply your
`ModelIdCriterion` to the query, resulting in correct user retrieval.

## And More

There're more features that can be added to the resource class. For example, you can define a global list of inclusions
(that should be loaded in all requests, regarding the query string), or define a default sorting column/direction
(if the query string doesn't have `order_by` parameter).

Each documentation section covers such features in more detail.
