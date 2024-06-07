# API Versioning

Laniakea provides simple support for API Versioning by utilizing versioned containers with Laravel's
[Service Container](https://laravel.com/docs/container#main-content).

## The principle

The idea behind API Versioning in Laniakea is to provide a way to bind different versions of your requests, transformers,
and services to Laravel's Service Container, and then resolve them based on the requested version.

API Versioning is a complex problem and some applications might require more advanced solutions. However, for most 
applications, Laniakea's API Versioning should be sufficient.

## What should be versioned?

In public APIs, the main points of versioning are usually the request and response formats. When you raise the version
of your API, you might want to change the structure of the request payload or the structure of the response data.
However, the business logic required for request processing in most cases remains the same between versions.

Let's say you have some products API. In version 1, you have a request to create a new product like this:

```json
{
    "product_name": "Product name",
    "product_price": 100
}
```

And the response for version 1 looks like this:

```json
{
    "id": 1,
    "name": "Product name",
    "price": "100"
}
```

In version 2, you want to change field names in the request, switch to UUIDs as public IDs, and change the price format. 
The request and response schema for version 2 might look like this: :

```json
{
    "name": "Product name",
    "price": 100
}
```

```json
{
    "id": "5800ce07-d00b-4e7a-b707-a3273e8b1e4c",
    "name": "Product name",
    "price": 10000
}
```

These requests and responses are different, but the business logic that processes these requests and responses might be the same.

::: tip
You can version virtually any service you want (including [repositories](/repositories) and [resources](/resources)).

And of course, you can version your own userland code as well.
:::

## Create product example

Let's say you have `StoreProductRequest`, `CreateProduct` action, `ProductTransformer` and `ProductsApiController`
to handle product creation.

::: code-group
```php [ProductsApiController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateProduct;
use App\Http\Requests\Products\StoreProductRequest;
use App\Transformers\ProductTransformer;
use Illuminate\Http\JsonResponse;

class ProductsApiController
{
    public function store(StoreProductRequest $request, CreateProduct $action): JsonResponse
    {
        $product = $action->create($request);

        return response()->json(
            (new ProductTransformer())->toArray($product),
        );
    }
}
```

```php [StoreProductRequest.php]
<?php

declare(strict_types=1);

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_name' => 'required|string|max:255',
            'product_price' => 'required|numeric',
        ];
    }
}
```

```php [CreateProduct.php]
<?php

declare(strict_types=1);

namespace App\Actions;

use App\Http\Requests\Products\StoreProductRequest;
use App\Models\Product;
use Illuminate\Support\Str;

class CreateProduct
{
    public function create(StoreProductRequest $request): Product
    {
        return Product::create([
            'uuid' => Str::orderedUuid()->toString(),
            'name' => $request->input('product_name'),
            'price' => $request->integer('product_price') * 100, // Store price in cents.
        ]);
    }
}
```

```php [ProductTransformer.php]
<?php

declare(strict_types=1);

namespace App\Transformers;

use App\Models\Product;

class ProductTransformer
{
    public function toArray(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price / 100, // Display price in dollars.
        ];
    }
}
```
:::

## How to version?

Now, how to add new version for this API?

The first approach would be to create a new controller, request, action, and transformer for version 2. 
However, this requires duplicating all the business logic, which is not ideal. Also, if you add something to the
`CreateProduct` action for version 2, you might need to add the same thing to version 1 (feature backport) and keep
track of business logic in both versions.

Instead, you can do the following (only create separate requests and transformers for each version):

1. Create `StoreProductRequestInterface` and `ProductTransformerInterface` interfaces;
2. Implement these interfaces in current request and transformer;
3. Create new requests and transformers for version 2 that implement these interfaces;
4. Bind these interfaces to the Laravel's Service Container with different versions;
5. Resolve requests and transformers from the container based on the requested version;
6. Refactor the controller & action to use interfaces instead of implementations.

::: code-group
```php [ProductsApiController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateProduct;
use App\Interfaces\Products\ProductTransformerInterface;
use App\Interfaces\Products\StoreProductRequestInterface;
use Illuminate\Http\JsonResponse;

class ProductsApiController
{
    public function store(
        StoreProductRequestInterface $request,
        CreateProduct $action,
        ProductTransformerInterface $transformer
    ): JsonResponse {
        $product = $action->create($request);

        return response()->json(
            $transformer->toArray($product),
        );
    }
}
```

```php [StoreProductRequest.php]
<?php

declare(strict_types=1);

namespace App\Http\Requests\Products;

use App\Interfaces\Products\StoreProductRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest implements StoreProductRequestInterface
{
    public function rules(): array
    {
        return [
            'product_name' => 'required|string|max:255',
            'product_price' => 'required|numeric',
        ];
    }

    public function getProductName(): string
    {
        return $this->input('product_name');
    }

    public function getProductPrice(): int
    {
        return $this->integer('product_price');
    }
}
```

```php [CreateProduct.php]
<?php

declare(strict_types=1);

namespace App\Actions;

use App\Interfaces\Products\StoreProductRequestInterface;
use App\Models\Product;
use Illuminate\Support\Str;

class CreateProduct
{
    public function create(StoreProductRequestInterface $request): Product
    {
        return Product::create([
            'uuid' => Str::orderedUuid()->toString(),
            'name' => $request->getProductName(),
            'price' => $request->getProductPrice() * 100, // Store price in cents.
        ]);
    }
}
```

```php [ProductTransformer.php]
<?php

declare(strict_types=1);

namespace App\Transformers;

use App\Interfaces\Products\ProductTransformerInterface;
use App\Models\Product;

class ProductTransformer implements ProductTransformerInterface
{
    public function toArray(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price / 100, // Display price in dollars.
        ];
    }
}
```
:::

The `StoreProductRequestInterface` and `ProductTransformerInterface` interfaces might look like this:

::: code-group
```php [ProductTransformerInterface.php]
<?php

declare(strict_types=1);

namespace App\Interfaces\Products;

interface StoreProductRequestInterface
{
    public function getProductName(): string;

    public function getProductPrice(): int;
}
```

```php [ProductTransformerInterface.php]
<?php

declare(strict_types=1);

namespace App\Interfaces\Products;

use App\Models\Product;

interface ProductTransformerInterface
{
    public function toArray(Product $product): array;
}
```
:::

## Register API versions

Laniakea provides the `Laniakea\Versions\Interfaces\VersionedResourceRegistrarInterface` interface which can be
implemented on your [resource registrar](/resources/registrars) class to bind different versions of your services to
Laravel's Service Container.

In the `bindVersions()` method, you have access to the `Laniakea\Versions\Interfaces\VersionBinderInterface` instance.
Its `bind()` method accepts the version name as the first argument (in this case, `v1`), an array of bindings for this
version as the second argument, and a boolean flag that you can use to mark this version as default (as the third argument).

```php
<?php

declare(strict_types=1);

namespace App\Resources\Registrars;

use App\Http\Requests\Products\StoreProductRequest;
use App\Interfaces\Products\ProductTransformerInterface;
use App\Interfaces\Products\StoreProductRequestInterface;
use App\Repositories\ProductsRepository;
use App\Resources\ProductsResource;
use App\Transformers\ProductTransformer;
use Laniakea\Resources\Interfaces\ResourceRegistrarInterface;
use Laniakea\Resources\Interfaces\ResourceRouteBinderInterface;
use Laniakea\Versions\Interfaces\VersionBinderInterface;
use Laniakea\Versions\Interfaces\VersionedResourceRegistrarInterface;

class ProductsRegistrar implements ResourceRegistrarInterface, VersionedResourceRegistrarInterface
{
    public function bindVersions(VersionBinderInterface $binder): void
    {
        $binder->bind('v1', [
            StoreProductRequestInterface::class => StoreProductRequest::class,
            ProductTransformerInterface::class => ProductTransformer::class,
        ], isDefault: true);
    }

    public function bindRoute(ResourceRouteBinderInterface $binder): void
    {
        $binder->bind('product', ProductsResource::class, ProductsRepository::class);
    }
}
```

When you introduce a new API version, update the `bindVersions()` method to include the new version bindings:

::: code-group
```php [ProductsRegistrar.php]
<?php

declare(strict_types=1);

namespace App\Resources\Registrars;

use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\StoreProductRequestV2;
use App\Interfaces\Products\ProductTransformerInterface;
use App\Interfaces\Products\StoreProductRequestInterface;
use App\Repositories\ProductsRepository;
use App\Resources\ProductsResource;
use App\Transformers\ProductTransformer;
use App\Transformers\ProductTransformerV2;
use Laniakea\Resources\Interfaces\ResourceRegistrarInterface;
use Laniakea\Resources\Interfaces\ResourceRouteBinderInterface;
use Laniakea\Versions\Interfaces\VersionBinderInterface;
use Laniakea\Versions\Interfaces\VersionedResourceRegistrarInterface;

class ProductsRegistrar implements ResourceRegistrarInterface, VersionedResourceRegistrarInterface
{
    public function bindVersions(VersionBinderInterface $binder): void
    {
        $binder->bind('v1', [
            StoreProductRequestInterface::class => StoreProductRequest::class,
            ProductTransformerInterface::class => ProductTransformer::class,
        ], isDefault: true);

        $binder->bind('v2', [
            StoreProductRequestInterface::class => StoreProductRequestV2::class,
            ProductTransformerInterface::class => ProductTransformerV2::class,
        ]);
    }

    public function bindRoute(ResourceRouteBinderInterface $binder): void
    {
        $binder->bind('product', ProductsResource::class, ProductsRepository::class);
    }
}
```

```php [StoreProductRequestV2.php]
<?php

declare(strict_types=1);

namespace App\Http\Requests\Products;

use App\Interfaces\Products\StoreProductRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequestV2 extends FormRequest implements StoreProductRequestInterface
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric',
        ];
    }

    public function getProductName(): string
    {
        return $this->input('name');
    }

    public function getProductPrice(): int
    {
        return $this->integer('price');
    }
}
```

```php [ProductTransformerV2.php]
<?php

declare(strict_types=1);

namespace App\Transformers;

use App\Interfaces\Products\ProductTransformerInterface;
use App\Models\Product;

class ProductTransformerV2 implements ProductTransformerInterface
{
    public function toArray(Product $product): array
    {
        return [
            'id' => $product->uuid, // Use UUID as public ID
            'name' => $product->name,
            'price' => $product->price, // Display price as cents
        ];
    }
}
```
:::

::: tip
If you have already registered this registrar, you don't need to do anything else.
:::

Now add your registrar to the `laniakea.registrars` configuration key and you're almost ready to go!

```php
<?php

return [
    'registrars' => [
        App\Resources\Registrars\ProductsRegistrar::class,
    ],
];
```

## `SetApiVersion` middleware

Laniakea's `Laniakea\Versions\Middleware\SetApiVersion` middleware is responsible for setting the requested API version
from the route files.

Before you start, you need to [register](/getting-started#register-middleware) this middleware in your Laravel application.
Make sure that you register this middleware to run before the Laravel's `Illuminate\Routing\Middleware\SubstituteBindings`.
[Learn more about how to do this](/getting-started#middleware-priority).

## Register API routes

Now, register your API controller under both API versions in your routes file. Use the `laniakea.version` middleware
alias (if you chose different alias, use your own) to register the API route version (don't forget to specify the version
name in the middleware's first parameter).

```php
<?php

declare(strict_types=1);

use App\Http\Controllers\ProductsApiController;
use Illuminate\Support\Facades\Route;

Route::group(['middleware' => ['laniakea.request']], function () {
    Route::group([
        'prefix' => '/v1',
        'as' => 'v1.',
        'middleware' => ['laniakea.version:v1']
    ], function () {
        Route::post('/products', [ProductsApiController::class, 'store'])->name('products.store');
    });

    Route::group([
        'prefix' => '/v2',
        'as' => 'v2.',
        'middleware' => ['laniakea.version:v2']
    ], function () {
        Route::post('/products', [ProductsApiController::class, 'store'])->name('products.store');
    });
});
```

If everything is done correctly, you should be able to access your API under the `/v1/products` and `/v2/products` routes.

## Resources versioning

As mentioned earlier, you can version even your [resource classes](/resources). Why? Because you might want to change
filters or sorters in the new API version, or even introduce completely new type of API.

To version your resources, you can use the same approach as for the requests and transformers. Create interfaces for
your resource classes and bind them to the Service Container with different versions.

::: code-group
```php [ProductsResourceInterface.php]
<?php

declare(strict_types=1);

namespace App\Interfaces;

use Laniakea\Resources\Interfaces\ResourceInterface;

interface ProductsResourceInterface extends ResourceInterface
{
    // For simplicity, we will not define any additional methods here.
}
```

```php [ProductsResource.php]
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Interfaces\ProductsResourceInterface;
use App\Resources\Filters\SearchFilter;
use App\Resources\Filters\ProductsCategoryFilter;
use Laniakea\Resources\Sorters\ColumnSorter;

class ProductsResource implements ProductsResourceInterface
{
    public function getFilters(): array
    {
        return [
            'search' => new SearchFilter(['name']),
            'category_id' => new ProductsCategoryFilter(),
        ];
    }

    public function getInclusions(): array
    {
        return [
            'category' => ['category'],
            'images' => ['images'],
        ];
    }

    public function getSorters(): array
    {
        return [
            'id' => new ColumnSorter(),
            'name' => new ColumnSorter(),
        ];
    }
}
```
:::

Now, in the new API version you want to rename categories into collections (so you need to change the `category_id` filter
and `category` inclusion). On the database and business logic level, nothing changes, but you want to provide a new API
version with a new structure.

One approach would be to duplicate both filter and inclusion and keep the same resource class. However, if this does
not suit your needs, you can version the resource class itself.

Create new products resource class with new filters and inclusions:

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use App\Interfaces\ProductsResourceInterface;
use App\Resources\Filters\SearchFilter;
use App\Resources\Filters\ProductsCategoryFilter;
use Laniakea\Resources\Sorters\ColumnSorter;

class ProductsResourceV2 implements ProductsResourceInterface
{
    public function getFilters(): array
    {
        return [
            'search' => new SearchFilter(['name']),
            'collection_id' => new ProductsCategoryFilter(),
        ];
    }

    public function getInclusions(): array
    {
        return [
            'collection' => ['category'],
            'images' => ['images'],
        ];
    }

    public function getSorters(): array
    {
        return [
            'id' => new ColumnSorter(),
            'name' => new ColumnSorter(),
        ];
    }
}
```

As you can see, nothing really changed except filter and inclusion names. You're still using the same `ProductsCategoryFilter` filter
and `category` inclusion, but you're providing a different structure for your API consumers.

Now you can register these resources in the `ProductsRegistrar` registrar and then use them via the interface.

::: code-group
```php [ProductsRegistrar.php]
<?php

declare(strict_types=1);

namespace App\Resources\Registrars;

use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\StoreProductRequestV2;
use App\Interfaces\Products\ProductTransformerInterface;
use App\Interfaces\Products\StoreProductRequestInterface;
use App\Interfaces\ProductsResourceInterface;
use App\Repositories\ProductsRepository;
use App\Resources\ProductsResource;
use App\Resources\ProductsResourceV2;
use App\Transformers\ProductTransformer;
use App\Transformers\ProductTransformerV2;
use Laniakea\Resources\Interfaces\ResourceRegistrarInterface;
use Laniakea\Resources\Interfaces\ResourceRouteBinderInterface;
use Laniakea\Versions\Interfaces\VersionBinderInterface;
use Laniakea\Versions\Interfaces\VersionedResourceRegistrarInterface;

class ProductsRegistrar implements ResourceRegistrarInterface, VersionedResourceRegistrarInterface
{
    public function bindVersions(VersionBinderInterface $binder): void
    {
        $binder->bind('v1', [
            ProductsResourceInterface::class => ProductsResource::class,
            StoreProductRequestInterface::class => StoreProductRequest::class,
            ProductTransformerInterface::class => ProductTransformer::class,
        ], isDefault: true);

        $binder->bind('v2', [
            ProductsResourceInterface::class => ProductsResourceV2::class,
            StoreProductRequestInterface::class => StoreProductRequestV2::class,
            ProductTransformerInterface::class => ProductTransformerV2::class,
        ]);
    }

    public function bindRoute(ResourceRouteBinderInterface $binder): void
    {
        $binder->bind('product', ProductsResource::class, ProductsRepository::class);
    }
}
```
```php [ProductsApiController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateProduct;
use App\Interfaces\ProductsResourceInterface;
use App\Http\Requests\Products\StoreProductRequest;
use App\Repositories\ProductsRepository;
use App\Transformers\ProductTransformer;
use Illuminate\Http\JsonResponse;
use Laniakea\Resources\Interfaces\ResourceManagerInterface;
use Laniakea\Resources\Interfaces\ResourceRequestInterface;

class ProductsApiController
{
    public function index(
        ResourceManagerInterface $request,
        ProductsResourceInterface $resource,
        ResourceManagerInterface $manager,
    ): JsonResponse {
        $paginator = $manager->paginate($request, $resource, new ProductsRepository());

        return response()->json($paginator);
    }
}
```
:::
