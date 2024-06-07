# Resource Requests

Resource requests are used by [Resource Manager](/resources/manager) to perform various operations on your resources, such as:

- Filter records;
- Sort records;
- Load relationships;
- Paginate records.

## Why not use `Request` instead? {#why-not-use-request}

While resource request is basically a wrapper around Laravel's `Illuminate\Http\Request` class, it provides a more
structured way to work with resource-related data.

For example, it allows you to [override](/configuration) request field names that are used to retrieve filter values, sorting field & direction,
and list of relationships to load.

Also, you can create custom resource request and use it in places where there's no HTTP request available (for example,
console commands or background jobs).

## Creating a resource request {#create}

Laniakea provides default resource request class that you can use right away. The only requirement is a 
`Laniakea\Resources\Middleware\SetResourceRequest` [middleware](/getting-started#middleware) that should be attached to
all your routes that will be using [Resource Manager](/resources/manager).

Of course, you can skip this middleware and create your own implementation of
`Laniakea\Resources\Interfaces\ResourceRequestInterface` and use it instead.

## Using default resource request {#use-request}

To use default resource request, simply inject the `Laniakea\Resources\Interfaces\ResourceRequestInterface` interface 
into your controller method. If the `SetResourceRequest` middleware was attached to the route, your controller method
will receive instance of `Laniakea\Resources\Requests\ResourceRequest` class.

Now you can either use this request instance directly, or pass it to the [Resource Manager](/resources/manager)'s methods.

## Retrieve list of inclusions {#get-inclusions}

In some cases you might need to know what inclusions were requested by the client. For example, if you're using
[Fractal Transformers](https://fractal.thephpleague.com), you'll need list of inclusions for `parseIncludes` method.

You can retrieve them using the `getInclusions()` method of the resource request instance (example below uses 
[Spatie's](https://spatie.be) [`spatie/laravel-fractal`](https://github.com/spatie/laravel-fractal) package):

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Book;
use App\Repositories\BooksRepository;
use App\Resources\BooksResource;
use App\Transformers\Books\BookTransformer;
use Illuminate\Http\JsonResponse;
use Laniakea\Resources\Interfaces\ResourceManagerInterface;
use Laniakea\Resources\Interfaces\ResourceRequestInterface;

class BooksApiController
{
    public function index(
        ResourceRequestInterface $request, 
        ResourceManagerInterface $manager,
    ): JsonResponse {
        $paginator = $manager->getPaginator(
            $request,
            new BooksResource(),
            new BooksRepository(),
        );

        return fractal($paginator, new BookTransformer())
            // Make sure to pass list of inclusions to the fractal transformer.
            ->parseIncludes($request->getInclusions())
            ->respond();
    }

    public function show(
        ResourceRequestInterface $request,
        Book $book,
    ): JsonResponse {
        return fractal($book, new BookTransformer())
            // Make sure to pass list of inclusions to the fractal transformer.
            ->parseIncludes($request->getInclusions())
            ->respond();
    }
}
```
