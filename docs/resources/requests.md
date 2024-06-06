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
