# Repositories

Laniakea's repositories provide access to basic CRUD operations on Eloquent models, including:
- Creating a new model;
- Updating an existing model; 
- Deleting an existing model; 
- Retrieving a single model by its primary key;
- Retrieving the first model matching the query;
- Listing models matching the query; 
- Paginating models.

## Creating a repository {#create-repository}

While you can implement the `Laniakea\Repositories\Interfaces\RepositoryInterface` interface directly, 
it is recommended to extend the `Laniakea\Repositories\AbstractRepository` class, which already implements the interface.

All you need to do is return the model class name from the getModel method of the repository class.

```php
<?php

declare(strict_types=1);

namespace App\Repositories;

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

## Create a model {#create}

Use the `create()` method of the repository to create a new model.

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$user = $usersRepository->create([
    'name' => 'John Doe',
    'email' => 'john@example.org',
    'password' => 'secretsecret',
]);
```

## Update a model {#update}

Use the `update()` method of the repository to update a model. Pass the ID of the model as first argument
and array of attributes to update as second argument.

::: tip
The `AbstractRepository` retrieves the model by the provided ID from database and then updates it. If the model is not
found, it will throw a `ModelNotFoundException` exception.
:::

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$user = $usersRepository->update(2, [
    'name' => 'John Doe',
    'email' => 'john@example.org',
    'password' => 'secretsecret',
]);
```

If your model uses non-integer primary key (UUID, for example), you can pass the key as a string.

::: tip
The `AbstractRepository` has no idea of your [resources](/resources). So even if your resource implements the
[`HasItemCriterionInterface`](/resources#item-criterion) interface, repository will not use it.
:::

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$user = $usersRepository->update('f9d024cf-9233-414d-831f-5e0daca69dd6', [
    'name' => 'John Doe',
    'email' => 'john@example.org',
    'password' => 'secretsecret',
]);
````

## Delete a model {#delete}

Use the `delete()` method of the repository to delete a model. Pass the ID of the model as first argument.

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$usersRepository->delete(2);
```

::: tip
The `AbstractRepository` retrieves the model by the provided ID from database and then deletes it. If the model is not
found, it will throw a `ModelNotFoundException` exception.
:::

## Find a model {#find}

Utilize the `find()` method of the repository to retrieve a model by its primary key. If the model is not found, this 
method will return `null`.

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$user = $usersRepository->find(2);
````

Of course, if your model uses non-integer primary key (UUID, for example), you can pass the key as a string.

```php
<?php

use App\Repositories\UsersRepository;

$usersRepository = app(UsersRepository::class);

$user = $usersRepository->find('f9d024cf-9233-414d-831f-5e0daca69dd6');
````

## Find a model or fail {#findOrFail}

The `findOrFail()` method works the same as `find()` but throws `ModelNotFoundException` exception if the model does not exist.

```php
<?php

use App\Repositories\UsersRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;

$usersRepository = app(UsersRepository::class);

try {
    $user = $usersRepository->findOrFail('f9d024cf-9233-414d-831f-5e0daca69dd6');
} catch (ModelNotFoundException $e) {
    // Model does not exist.
}
````

## Get first model {#first}

The `first()` method of the repository instance returns either the first record from the database or the first record 
matching the query. You can manipulate the query in the callback function by passing it as the first argument.

The callback accepts a `Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface` instance as its first argument.
This instance can be utilized in several ways.

### Apply [critera](/repositories/criteria) {#first-addCriteria}

Add list of criteria to the query by using the `addCriteria()` method.

```php
$usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
    $query->addCriteria([
      new WhereLikeCriterion('email', 'hello%')
    ]);
});
```

:::tip
Learn more about repository criteria in a [separate article](/repositories/criteria).
:::

### Load relationships {#with}

Load model relationships by using the `with()` method.

```php
$usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
    $query->with(['posts.comments', 'media']);
});
```

### Order results {#orderBy}

Order the query results by using the `orderBy()` method.

```php
$usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
    $query->orderBy('created_at', 'desc');
});
```

If you need multiple ordering, call `orderBy()` method several times. In the example below, users will be sorted
by `created_at` descending and then by `name()` ascending.

```php
$usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
    $query->orderBy('created_at', 'desc')->orderBy('name');
});
```

### Chaining methods {#first-chaining}

All methods of `RepositoryQueryBuilderInterface` can be chained and used in any order.

```php
$usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
    $query->with(['posts.comments', 'media'])->orderBy('created_at', 'desc')->orderBy('name')->addCriteria([
      new WhereLikeCriterion('email', 'hello%')
    ]);
});
```

## Get first model or fail {#firstOrFail}

Use `firstOrFail()` method to throw `ModelNotFoundException` if no results were found. It accepts the same callback
as `first()` method.

```php
try {
    $user = $usersRepository->first(function (RepositoryQueryBuilderInterface $query) {
        $query->with(['posts.comments', 'media'])->orderBy('created_at', 'desc')->orderBy('name')->addCriteria([
          new WhereLikeCriterion('email', 'hello%')
        ]);
    });
} catch (ModelNotFoundException $e) {
    // Such user does not exist.
}
```

## List models {#list}

The `list()` method allows you to retrieve several models based on your query. It accepts callback as first argument,
where you can manipulate the query.

```php
$users = $usersRepository->list(function (RepositoryQueryBuilderInterface $query) {
    $query->with(['posts.comments', 'media'])->orderBy('created_at', 'desc')->orderBy('name')->addCriteria([
      new WhereLikeCriterion('email', 'hello%')
    ]);
});
```

### Limit number of results {#list-limit}

In addition to described `RepositoryQueryBuilderInterface` methods, you can limit number of results that will be returned
by the query. Use `limit()` method to set limit and/or skip number of rows.

In the example below, it will skip first 15 rows and take 10 users.

```php
$users = $usersRepository->list(function (RepositoryQueryBuilderInterface $query) {
    $query->with(['posts.comments', 'media'])->orderBy('created_at', 'desc')->orderBy('name')->addCriteria([
      new WhereLikeCriterion('email', 'hello%')
    ])->limit(10, 15);
});
```

### Access the original query builder {#list-getQueryBuilder}

If you need access to the original Eloquent's query builder (`Illuminate\Database\Eloquent\Builder`),
use the `getQueryBuilder()` method to do so.

```php
$users = $usersRepository->list(function (RepositoryQueryBuilderInterface $query) {
    $queryBuilder = $query->getQueryBuilder();
    
    // Call original query builder's methods.
    $queryBuilder->with(['posts.comments'])->take(10)->skip(15);
});
```

## Paginate models {#paginate}

The `paginate()` method allows you to retrieve instance of Laravel's `Illuminate\Contracts\Pagination\LengthAwarePaginator`.

You can either specifiy count and page number by providing it in arguments, or let Laravel's current page resolver
do the work for you.

The third argument is a callback, where you can manipulate the query by using `RepositoryQueryBuilderInterface` instance.

```php
$usersPaginator = $usersRepository->paginate(
    count: $request->integer('count', 20),
    page: $request->integer('page', 1),
    callback: function (RepositoryQueryBuilderInterface $query) {
        $query->with(['posts.comments', 'media'])->orderBy('created_at', 'desc')->orderBy('name')->addCriteria([
          new WhereLikeCriterion('email', 'hello%')
        ]);
        
        // Eloquent query builder is also available here.
        $query->getQueryBuilder()->take(10)->skip(15);
    },
);
```

