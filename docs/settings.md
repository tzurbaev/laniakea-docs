# Model Settings

If your application requires heavy use of custom per-model settings (like user preferences, application settings, etc.),
Laniakea can help you with that. It provides a simple way to store, update, and retrieve settings for your Eloquent models.

The model settings system is based on PHP's [backed enums](https://www.php.net/manual/en/language.enumerations.backed.php)
and [attributes](https://www.php.net/manual/en/language.attributes.overview.php).

## The problem

Let's say your application needs settings system for registered users. Each user can select what notifications they want to receive,
what UI theme (dark or light) they want to use, and so on. Users also must have ability to change these settings at any time.

You can create a separate table in your database to store these settings, but it will require additional queries to fetch them.
In opposite, you can store these settings in a JSON column in the `users` table, but it might be challenging to manage
and use them in your codebase, especially if you need to validate them.

## The solution

Laniakea has a model settings system that allows you to define list of such settings, set the type of each setting, and
provide default values for them. It also validates settings before saving them to the database and
automatically converts values to required types before saving and after retrieving them.

## Defining settings

All settings (per model type) must be defined in a single string-backed enum class. Each enum case
must have an attribute that defines the type of the setting, its default value, and, depending on setting type,
additional parameters.

This is an example of how you can define settings for your `User` model:

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

Read more about available setting types in [separate article](/settings/types).

## Storing settings

Laniakea's approach to store settings is to use a single JSON column in the model's table. This column will store
all settings as a single JSON object, where keys are setting names and values are setting values.

You need to add such column to your model's table (name can be anything you want, but in this docs we're going to use `settings` column).

Each model that uses settings must implement the `Laniakea\Settings\Interfaces\HasSettingsInterface` interface.

The `getSettingsEnum()` method must return class name of the settings enum that you've defined earlier.

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Settings\UserSetting;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laniakea\Settings\Interfaces\HasSettingsInterface;

class User extends Authenticatable implements HasSettingsInterface
{
    /**
     * Get settings enum class name.
     *
     * @return string
     */
    public function getSettingsEnum(): string
    {
        return UserSetting::class;
    }
}

```

The `getCurrentSettings()` method must return array with current settings values or `null` value (if there are no settings saved).

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Settings\UserSetting;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laniakea\Settings\Interfaces\HasSettingsInterface;

class User extends Authenticatable implements HasSettingsInterface
{
    /**
     * Get current model settings.
     *
     * @return array|null
     */
    public function getCurrentSettings(): ?array
    {
        return $this->settings;
    }
}
```

The `updateSettings()` method must accept an array of settings and save them to the database.

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Settings\UserSetting;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laniakea\Settings\Interfaces\HasSettingsInterface;

class User extends Authenticatable implements HasSettingsInterface
{
    /**
     * Write settings to persisted storage.
     *
     * @param array $settings
     */
    public function updateSettings(array $settings): void
    {
        $this->update(['settings' => $settings]);
    }
}
```

## Using settings

Since all settings are stored in model's attribute, you can access them just like any other model attribute:

```php
<?php

$user = User::first();

if ($user->settings['dark_mode_enabled']) {
    // Dark mode is enabled.
}
```

However, with this approach you need to check if settings actually exist, if specific setting has correct value
(in this case `dark_mode_enabled` should have a `boolean` type) and somehow manage default values.

```php
<?php

$user = User::first();

if (!is_null($user->settings) && $user->settings['dark_mode_enabled']) {
    // Dark mode is enabled.
}

// or

if ($user->settings['dark_mode_enabled'] ?? false) {
    // Dark mode is enabled.
}
```

While it's OK for simple cases, it's not very convenient for more complex settings systems.

## Settings decorators {#decorators}

Instead, you can use settings decorators to work with settings in a more structured way.

First of all, create new class that extends the `Laniakea\Settings\SettingsDecorator`. Inside this class you
can access any setting value by its name with ability to provide default value if there's no such setting available.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\SettingsDecorator;

class UserSettingsDecorator extends SettingsDecorator
{
    public function isDarkModeEnabled(): bool
    {
        return $this->getValue(UserSetting::DARK_MODE) === true;
    }

    public function getEnabledNotifications(): array
    {
        return $this->getValue(UserSetting::ENABLED_NOTIFICATIONS, []);
    }

    public function getEmailSignature(): ?string
    {
        return $this->getValue(UserSetting::EMAIL_SIGNATURE);
    }
}
```

Next, implement the `Laniakea\Settings\Interfaces\HasSettingsDecoratorInterface` interface on your model and add
trait `Laniakea\Settings\Concerns\CreatesSettingsDecorators`.

And finally, implement the `getSettingsDecorator()` method that should return instance of your settings decorator.
Use the `CreatesSettingsDecorators` trait's `makeSettingsDecorator()` method to create new decorator instance.

This method will either create new settings decorator instance and save it in `protected $settingsDecorator` property,
or re-use existing instance if it's already created.

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Settings\UserSettingsDecorator;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laniakea\Settings\Concerns\CreatesSettingsDecorators;
use Laniakea\Settings\Interfaces\HasSettingsDecoratorInterface;
use Laniakea\Settings\Interfaces\HasSettingsInterface;

class User extends Authenticatable implements HasSettingsInterface, HasSettingsDecoratorInterface
{
    use CreatesSettingsDecorators;

    public function getSettingsDecorator(bool $fresh = false): UserSettingsDecorator
    {
        return $this->makeSettingsDecorator(UserSettingsDecorator::class, $fresh);
    }
}
```

Now you can use this decorator to read and update settings.

## Read settings

Call the `getSettingsDecorator()` method on your model to get settings decorator instance.

```php
<?php

$user = User::first();

if ($user->getSettingsDecorator()->isDarkModeEnabled()) {
    // Dark mode is enabled.
}
```

The same settings decorator instance will be returned on subsequent calls to `getSettingsDecorator()` method. However,
you can force to create new instance by passing `true` as a `$fresh` parameter.

```php
<?php

$user = User::first();
$user->update(['settings' => ['dark_mode_enabled' => true]]);

if ($user->getSettingsDecorator(fresh: true)->isDarkModeEnabled()) {
    // Dark mode is enabled.
}
```

Use the `$fresh` argument to make sure that you're working with the most recent settings data (especially after
updating models). Please note, that any subsequent calls to `getSettingsDecorator()` method with `$fresh = true` will
recreate settings decorator instance.

::: tip
If current model is missing some settings (array keys), settings decorator will use default value that you provide
to the `getValue()` method inside your methods.
:::

## Update settings

It might be logical to use `updateSettings()` method on your model to update settings, but there's a catch.

This method is used by `Laniakea\Settings\Interfaces\SettingsUpdaterInterface` to update settings in the database.
The `SettingsUpdaterInterface` performs validation and merges default values with updated values before saving them.

Instead, use settings decorator's `fill()` or `update()` methods.

### Update settings using `fill()` method {#fill-method}

Use `fill()` method of the settings decorator to update settings. You don't have to provide all settings, only those that you want to update.

```php
<?php

$user = User::first();

$user->getSettingsDecorator()->fill([
    UserSetting::DARK_MODE_ENABLED->value => false,
    UserSetting::ENABLED_NOTIFICATIONS => [
        NotificationType::ORDER_CREATED,
        NotificationType::ORDER_SHIPPED,
    ],
]);
```

It is not required to re-create fresh settings decorator after updating settings – you can read them right away.

```php
<?php

$user = User::first();

$user->getSettingsDecorator()->fill([
    UserSetting::DARK_MODE_ENABLED->value => false,
    UserSetting::ENABLED_NOTIFICATIONS->value => [
        NotificationType::ORDER_CREATED,
        NotificationType::ORDER_SHIPPED,
    ],
]);

// The `$darkModeEnabled` value will be false.
$darkModeEnabled = $user->getSettingsDecorator()->isDarkModeEnabled();
```

### Update settings using `update()` method {#update-method}

`update()` method can perform additional logic while updating settings.

As you noticed, the `settings` attribute contains a JSON object with single nesting level. However, when generating
forms (or designing API requests to update settings), it is common to use multi-level objects.

For example, your update settings API request might look like this:

```json
{
  "settings": {
    "notifications": {
      "list": [
        "order_created",
        "order_shipped"
      ]
    },
    "ui": {
      "dark_mode": false
    },
    "email": {
      "signature": "Sent from my iPhone"
    }
  }
}
```

Before saving this object you'll need to convert its keys to the enum case values:

- `notifications.list` -> `enabled_notifications`;
- `ui.dark_mode` -> `dark_mode_enabled`;
- `email.signature` -> `email_signature`.

To simplify this process, use the `Laniakea\Settings\RequestPath` attribute on every setting that should be 
updated from the request. Pass dot-notation string to the attribute's constructor that represents path in settings object.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\NotificationType;
use Laniakea\Settings\RequestPath;
use Laniakea\Settings\Types\BooleanSetting;
use Laniakea\Settings\Types\EnumArraySetting;
use Laniakea\Settings\Types\NullableStringSetting;

enum UserSetting: string
{
    // Simple boolean setting, disabled by default.
    #[
        BooleanSetting(false),
        RequestPath('ui.dark_mode')
    ]
    case DARK_MODE = 'dark_mode';

    // Setting that supports multiple values from a given enum,
    // with few selected cases by default.
    #[
        EnumArraySetting(
            [NotificationType::ORDER_CREATED, NotificationType::ORDER_PAID],
            NotificationType::class
        ),
        RequestPath('notifications.list')
    ]
    case ENABLED_NOTIFICATIONS = 'enabled_notifications';

    // Nullable string setting with null value by default.
    #[
        NullableStringSetting(null),
        RequestPath('email.signature')
    ]
    case EMAIL_SIGNATURE = 'email_signature';
}
```

Now you can pass structured object to the settings decorator's `update()` method without pre-processing it.

```php
<?php

$user = User::find(1);
$settings = [
    'notifications' => [
        'list' => [
            NotificationType::ORDER_CREATED,
            NotificationType::ORDER_SHIPPED,
        ],
    ],
    'ui' => [
        'dark_mode' => false,
    ],
    'email' => [
        'signature' => 'Sent from my iPhone',
    ],
];

$user->getSettingsDecorator()->update($settings);
```

If for some reason you need to update plain values with `update()` settings, pass `false` as second argument to ignore
request paths.

```php
<?php

$user = User::first();

$user->getSettingsDecorator()->update([
    UserSetting::DARK_MODE_ENABLED->value => false,
], false);
```
