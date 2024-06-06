# Configuration

Laniakea provides a `laniakea.php` configuration file for your Laravel app. It is primarily used for defining
your custom [resource registrars](/resources/registrars) but you can also redefine some internal settings, such as
request field names or custom implementations of internal classes.

## Publishing configuration

To publish the configuration file, run the following command:

```bash
php artisan vendor:publish --provider="Laniakea\Providers\LaniakeaServiceProvider"
```

The published configuration file will be located in the `config` directory of your Laravel app.

## Default configuration

By default the configuration file looks like this:

::: details Click to expand the default configuration file
```php
<?php

return [
    'registrars' => [
        // List your resource registrars here
    ],

    'resources' => [
        'fields' => [
            'count' => 'count',
            'page' => 'page',
            'inclusions' => 'with',
            'sorting' => 'order_by',
        ],

        'commands' => [
            'pagination' => [
                Laniakea\Resources\Commands\FilterResources::class,
                Laniakea\Resources\Commands\LoadInclusions::class,
                Laniakea\Resources\Commands\SortResources::class,
            ],

            'list' => [
                Laniakea\Resources\Commands\FilterResources::class,
                Laniakea\Resources\Commands\LoadInclusions::class,
                Laniakea\Resources\Commands\SortResources::class,
            ],

            'item' => [
                Laniakea\Resources\Commands\LoadInclusions::class,
            ],
        ],
    ],

    'bindings' => [
        Laniakea\Resources\Interfaces\ResourceManagerInterface::class => Laniakea\Resources\ResourceManager::class,
        Laniakea\Forms\Interfaces\FormIdsGeneratorInterface::class => Laniakea\Forms\FormIdsGenerator::class,
        Laniakea\Forms\Interfaces\FormsManagerInterface::class => Laniakea\Forms\FormsManager::class,
        Laniakea\Settings\Interfaces\SettingsGeneratorInterface::class => Laniakea\Settings\SettingsGenerator::class,
        Laniakea\Settings\Interfaces\SettingsUpdaterInterface::class => Laniakea\Settings\SettingsUpdater::class,
        Laniakea\Settings\Interfaces\SettingsValuesInterface::class => Laniakea\Settings\SettingsValues::class,
    ],
];
```
:::

## Resource registrars

The `registrars` array in the configuration file is used to define your custom resource registrars. A 
[resource registrar](/resources/registrars) s a class responsible for registering your resources in the
Laniakea service container.

To add a new registrar to the `registrars` array, simply add the fully-qualified class name (FQCN) of your registrar to the array:

```php
<?php

return [
    'registrars' => [
        App\Resources\Registrars\UsersRegistrar::class,
    ],
];
```

::: tip
Here and in other configuration examples we'll show only section-related options. You should merge it with the
full configuration file.
:::

## Resource request fields

The `resources.fields` array in the configuration file is used to define the names of the request fields that are used
for pagination, sorting, and including relations.

For example, if you want to use the `include` field for inclusions (instead of the default `with`) and the
`limit` field for pagination limit (instead of the default `count`), you can override them in the configuration file:

```php
<?php

return [
    'resources' => [
        'fields' => [
            'count' => 'count', // [!code --]
            'count' => 'limit', // [!code ++]
            'page' => 'page',
            'inclusions' => 'with', // [!code --]
            'inclusions' => 'include', // [!code ++]
            'sorting' => 'order_by',
        ],
    ],
];
```

After this change, all you need to do is to send inlcusions list in the `include` field and per-page count in `limit`
field (e.g., <nobr>`https://example.org/users?with=posts.comments&limit=50`</nobr>).

Since other fields were not changed, you can still use the `page` and `order_by` fields as before.

## Resource commands

The `resources.commands` array in the configuration file is used to define the list of commands that should be executed
during pagination, listing, and item loading.

It is very unlikely that you'll need to change this configuration, but if you want to add custom commands or
swap some default commands, you can do it here.

### Pagination and listing

During pagination (`getPaginator()` method of [resources manager](/resources/manager)) and listing 
(`getList()` method of [resources manager](/resources/manager)), the following commands are executed by default:

- `Laniakea\Resources\Commands\FilterResources` – filters resources by the provided query parameters;
- `Laniakea\Resources\Commands\LoadInclusions` – loads related relationships that should be included;
- `Laniakea\Resources\Commands\SortResources` – sorts resources by the provided query parameters.

### Item loading

During item loading (`getItem()` method of [resources manager](/resources/manager) or inside
[route model binding](/resources/manager#model-route-binding)), only `Laniakea\Resources\Commands\LoadInclusions`
command is executed by default, since there's no need to filter or sort a single resource.

## Bindings

If necessary, you can override the default bindings for internal classes in the `bindings` array. For example,
you can create your custom forms manager and bind it to the interfaces:

```php

return [
    'bindings' => [
        Laniakea\Resources\Interfaces\ResourceManagerInterface::class => Laniakea\Resources\ResourceManager::class,
        Laniakea\Forms\Interfaces\FormIdsGeneratorInterface::class => Laniakea\Forms\FormIdsGenerator::class,
        Laniakea\Forms\Interfaces\FormsManagerInterface::class => Laniakea\Forms\FormsManager::class, // [!code --]
        Laniakea\Forms\Interfaces\FormsManagerInterface::class => App\Forms\CustomFormsManager::class, // [!code ++]
        Laniakea\Settings\Interfaces\SettingsGeneratorInterface::class => Laniakea\Settings\SettingsGenerator::class,
        Laniakea\Settings\Interfaces\SettingsUpdaterInterface::class => Laniakea\Settings\SettingsUpdater::class,
        Laniakea\Settings\Interfaces\SettingsValuesInterface::class => Laniakea\Settings\SettingsValues::class,
    ],
];
```
