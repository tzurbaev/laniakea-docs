# Inclusions

Inclusions determine which related resources should be loaded from DB and included in the response.

## Defining inclusions

Inclusions are defined in the `getInclusions()` method of the resource class. The method should return an array where:

- key is a public name of the inclusion (used in the query string);
- value is an array of relationships to load;
- key might be a dot-notation string to define nested inclusions (like `posts.comments` to load posts and its comments).

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Laniakea\Resources\Interfaces\ResourceInterface;

class UsersResource implements ResourceInterface
{
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
}
```
By default inclusions are parsed from the `with` query parameter. So if the URL is <nobr>`/users?with=posts,avatar`</nobr>,
the `posts` and `avatar` relationships will be loaded.

Since resource allows to load posts and its comments, the URL <nobr>`/users?with=posts.comments`</nobr> will load posts
with comments.

You can [configure](/configuration) the query parameter name by changing the value of `laniakea.resources.fields.inclusions` param.

## Global inclusions

If you need to load specific relationships regardless of the user's request, you can define global inclusions.

Global inclusions are defined in resource class by implementing the `Laniakea\Resources\Interfaces\HasGlobalInclusionsInterface` interface.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Laniakea\Resources\Interfaces\HasGlobalInclusionsInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;

class UsersResource implements ResourceInterface, HasGlobalInclusionsInterface
{
    public function getGlobalInclusions(): array
    {
        return ['avatar'];
    }
}
```

The array returned by the `getGlobalInclusions()` method should contain the names of the relationships to load
(array keys of the `getInclusions()` method).

In the example above, the `avatar` relationship will be loaded regardless of whether the user requested it 
(`?with=avatar`) or not (`?with=posts`).

## Default inclusions

Also you can specify what relationships should be loaded by default (if user didn't provide any inclusions).
Please note, that if user provides any inclusions, default inclusions will be ignored.

To define default inclusions, implement the `Laniakea\Resources\Interfaces\HasDefaultInclusionsInterface` interface
on your resource class.

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Laniakea\Resources\Interfaces\HasDefaultInclusionsInterface;
use Laniakea\Resources\Interfaces\ResourceInterface;

class UsersResource implements ResourceInterface, HasDefaultInclusionsInterface
{
    public function getDefaultInclusions(): array
    {
        return ['posts.comments'];
    }
}
```

::: tip
Global and default inclusions work in tandem. Global inclusions are loaded regardless of the user's request, while
default inclusions are loaded only if the user didn't provide any inclusions.
:::
