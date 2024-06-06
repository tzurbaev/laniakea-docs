# What is Laniakea?

Laniakea is a Composer package for building small-to-medium APIs with the [Laravel Framework](https://laravel.com).

It supports API versioning, automatic resource filtering and sorting, and helps you manage model relationships. 
It also provides a simple form generator for your API resources.

## Primary features

### [API Resources](/resources)

The main feature of Laniakea is API resources. A resource is a combination of an Eloquent model,
HTTP requests and controllers, a repository, and a set of rules for filtering, sorting, and managing Eloquent
relationships (the Resource class itself).

For example, you can create a resource for the `User` model and define rules to:
- Filter by the `name` and `email` fields;
- Include the `posts` and `avatar` relationships;
- Sort by the `id` and `registered_at` fields.

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

When combined with other Laniakea features, you can create a full-featured API for your `User` model with just a few lines of code.

### [Repositories](/repositories)

Laniakea provides simple repositories for listing, creating, updating, and deleting Eloquent models. It also supports
class-based criteria for filtering purposes.

```php
<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use Laniakea\Repositories\AbstractRepository;
use Laniakea\Repositories\Criteria\ExactValueCriterion;
use Laniakea\Repositories\Interfaces\RepositoryQueryBuilderInterface;

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

    public function getUserByEmail(string $email): ?User
    {
        return $this->first(fn (RepositoryQueryBuilderInterface $query) => $query->addCriteria([
            new ExactValueCriterion('email', $email),
        ]));
    }
}
```

All repository methods that retrieve data (`list`, `paginate`, `first`, etc.) support custom callbacks, allowing you to
easily filter results, sort, load relations, and, of course, access the underlying Eloquent query builder interface.

### [Model Settings](/settings)

If your application requires heavy use of custom per-model settings (such as user preferences, application settings, etc.),
Laniakea can assist you with that. It provides a straightforward method for storing, updating, and retrieving settings 
for your Eloquent models.

The model settings system is based on PHP's [backed enums](https://www.php.net/manual/en/language.enumerations.backed.php)
and [attributes](https://www.php.net/manual/en/language.attributes.overview.php). For example, a simple settings 
enum might look like this:

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\NotificationType;
use Laniakea\Settings\Types\BooleanSetting;
use Laniakea\Settings\Types\EnumArraySetting;
use Laniakea\Settings\Types\NullableStringSetting;

enum UserSetting: string
{
    // Simple boolean setting, disabled by default.
    #[BooleanSetting(false)]
    case DARK_MODE_ENABLED = 'dark_mode_enabled';

    // Setting that supports multiple values from a given enum,
    // with few selected cases by default.
    #[EnumArraySetting([
        NotificationType::ORDER_CREATED,
        NotificationType::ORDER_PAID
    ], NotificationType::class)]
    case ENABLED_NOTIFICATIONS = 'enabled_notifications';

    // Nullable string setting with null value by default.
    #[NullableStringSetting(null)]
    case EMAIL_SIGNATURE = 'email_signature';
}
```

Laniakea also provides [Model Settings Decorators](/settings#decorators) for easy access to settings in your code.

### Forms

Additionally, Laniakea offers a simple [form](/forms) generator. While it's a backend-only feature (it does not provide
any frontend-specific tools), it can be used to structure your forms in PHP and then integrate them into your 
preferred frontend solution.

### [Exceptions](/exceptions)

Although it's not really a feature, Laniakea provides a set of exceptions that you can utilize in your application.
They are designed to offer more detailed information about what went wrong during API request processing with a 
consistent JSON structure.

## How is it different from other CRUD packages?

Probably not much. There are many feature-rich packages and admin panels that solve the same or similar problems.

Laniakea started as a small personal project and has evolved enough to be shared with the community.

## What Laniakea is not?

Firstly, it doesn't provide any UI. It's a backend package, and you need to build your own frontend.

Additionally, it's worth mentioning that Laniakea is not an admin panel in any way. It's a set of tools that you can use
to build one, or simply use it for building APIs.

## What does "Laniakea" mean?

According to [Wikipedia](https://en.wikipedia.org/wiki/Laniakea_Supercluster),  Laniakea is a supercluster of galaxies
that includes the Milky Way, our own galaxy, along with 100,000 other galaxies. 

I chose to name this package "Laniakea" because it encompasses a variety of features that could be published as
separate packages, akin to a "super" cluster of features.

Not humble, I know.
