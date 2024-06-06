# Settings types

Laniakea ships with several bundled settings types that you can use out of the box. Of course, you're free to create 
your own settings types as well.

## Available types

There are 9 built-in settings types:

- Array type (`Laniakea\Settings\Types\ArraySetting`);
- Boolean type (`Laniakea\Settings\Types\BooleanSetting`);
- Enum array type (`Laniakea\Settings\Types\EnumArraySetting`);
- Enum type (`Laniakea\Settings\Types\EnumSetting`);
- Float type (`Laniakea\Settings\Types\FloatSetting`);
- Integer type (`Laniakea\Settings\Types\IntegerSetting`);
- JSON type (`Laniakea\Settings\Types\JsonSetting`);
- Possible value (or one of) type (`Laniakea\Settings\Types\PossibleValueSetting`);
- String type (`Laniakea\Settings\Types\StringSetting`).

Also, most of them (except `ArraySetting` and `PossibleValueSetting`) also has a `nullable` types:

- Nullable boolean type (`Laniakea\Settings\Types\NullableBooleanSetting`);
- Nullable enum array type (`Laniakea\Settings\Types\NullableEnumArraySetting`);
- Nullable enum type (`Laniakea\Settings\Types\NullableEnumSetting`);
- Nullable float type (`Laniakea\Settings\Types\NullableFloatSetting`);
- Nullable integer type (`Laniakea\Settings\Types\NullableIntegerSetting`);
- Nullable JSON type (`Laniakea\Settings\Types\NullableJsonSetting`);
- Nullable string type (`Laniakea\Settings\Types\NullableStringSetting`).

All settings types must have a default value (which can be `null` for `nullable` types) and several
types provide additional options.

You need to pass default value and options to the constructor of each type.

## Validation

Each setting performs validation before allowing the value to be set. Non-validated values won't be saved into the database.

Default values are never validated, so you can set any value. If setting is not `nullable`, `null` values won't be
validated. If you need to store `null` values as valid values, use `nullable` setting type.

## Array

The `Laniakea\Settings\Types\ArraySetting` allows you to store any array as a setting value. It's also possible
to specify the list of allowed cases and whether the array can be empty.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\ArraySetting;

enum ExampleSetting: string
{
    #[ArraySetting([], ['first', 'second', 'thid'], true)]
    case ARRAY_SETTING = 'array_setting';
}
```

### Default value

Default value of `ArraySetting` must be an array of any elements. It also can be empty (even if the `allowEmpty` parameter
is set to `false`).

```php
// Empty array
#[ArraySetting([]])

// Pre-filled array
#[ArraySetting(['first', 'second']])
```

### Allowed cases

You can set list of allowed values by passing such list as second constructor argument. Upon setting the value, each array
item will be validated against this list and only allowed values will be saved.

```php
#[ArraySetting(['first'], ['first', 'second'])
```

### Empty arrays

By default this setting does not allow empty arrays. If you need to save empty arrays, set the third constructor argument
to `true`.

```php
#[ArraySetting(['first'], ['first', 'second'], true)
```

## Array of enums

The `Laniakea\Settings\Types\EnumArraySetting` allows you to store an array of specific enum cases. It's also possible
to specify whether the array can be empty.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\ExampleEnum;
use Laniakea\Settings\Types\EnumArraySetting;

enum ExampleSetting: string
{
    #[EnumArraySetting([], ExampleEnum::class, true)]
    case ENUM_ARRAY_SETTING = 'enum_array_setting';
}
```

### Default value

Default value of `EnumArraySetting` must be an array of enum values. It also can be empty (even if the `allowEmpty` parameter
is set to `false`).

::: tip
The values of array must be instances of `\BackedEnum` classes. If you provide a list of strings, it won't be validated.
:::

```php
#[EnumArraySetting([ExampleEnum::FIRST, ExampleEnum::SECOND])
```

### Enum class

You also must provide the enum class as the second argument of the constructor.

```php
#[EnumArraySetting([ExampleEnum::FIRST, ExampleEnum::SECOND], ExampleEnum::class)
```

### Empty arrays

By default this setting does not allow empty arrays. If you need to save empty arrays, set the third constructor argument
to `true`.

```php
#[EnumArraySetting([ExampleEnum::FIRST, ExampleEnum::SECOND], ExampleEnum::class, true)
```

## Boolean

The `Laniakea\Settings\Types\BooleanSetting` allows you to store boolean values.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\BooleanSetting;

enum ExampleSetting: string
{
    #[BooleanSetting(false)]
    case BOOLEAN_SETTING = 'boolean_setting';
}
```

### Default value

The only argument of this setting is the default value – it can be either `true` or `false`.

### Nullable boolean

The `Laniakea\Settings\Types\NullableBooleanSetting` is a `nullable` version of `BooleanSetting`. It is also accepts
only one argument – the default value, but in this case it can be `null`.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\NullableBooleanSetting;

enum ExampleSetting: string
{
    #[NullableBooleanSetting(null)]
    case NULLABLE_BOOLEAN_SETTING = 'nullable_boolean_setting';
}
```

## Enum

The `Laniakea\Settings\Types\EnumSetting` allows you to store a single enum case.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\NotificationType;
use Laniakea\Settings\Types\EnumSetting;

enum ExampleSetting: string
{
    #[EnumSetting(NotificationType::ORDER_PAID)]
    case ENUM_SETTING = 'enum_setting';
}
```

### Default value

The only argument of this setting is the default value – it can be instance of any backed enum class. This enum class
will also be used for validation – only other cases of this enum will be allowed.

### Nullable enum

The `Laniakea\Settings\Types\NullableEnumSetting` is a `nullable` version of `EnumSetting`. It accepts default
value as first argument, but if it's `null`, you need to provide enum class name as second argument – for validation
purposes.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\NotificationType;
use Laniakea\Settings\Types\NullableEnumSetting;

enum ExampleSetting: string
{
    #[NullableEnumSetting(null, NotificationType::class)]
    case NULLABLE_ENUM_SETTING = 'nullable_enum_setting';
}
```

## Float

The `Laniakea\Settings\Types\FloatSetting` allows you to store float values.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\FloatSetting;

enum ExampleSetting: string
{
    #[FloatSetting(3.14)]
    case FLOAT_SETTING = 'float_setting';
}
```

### Default value

The first argument of this setting is the default value – it can be any float number.

### Parse from strings

By default this setting does not allow float values from strings (like `'3.14'`). If you need to allow this, set the
second constructor argument to `true`.

```php
#[FloatSetting(3.14, true)]
```

### Nullable float

The `Laniakea\Settings\Types\NullableFloatSetting` is a `nullable` version of `FloatSetting`. It accepts default
value as first argument, but in this case it can be `null`. It also supports parsing from strings (as second argument).

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\NullableFloatSetting;

enum ExampleSetting: string
{
    #[NullableFloatSetting(null, true)]
    case NULLABLE_FLOAT_SETTING = 'nullable_float_setting';
}
```

## Integer

The `Laniakea\Settings\Types\IntegerSetting` allows you to store integer values.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\IntegerSetting;

enum ExampleSetting: string
{
    #[IntegerSetting(42)]
    case INTEGER_SETTING = 'integer_setting';
}
```

### Default value

The first argument of this setting is the default value – it can be any integer.

### Parse from strings

By default this setting does not allow integer values from strings (like `'54'`). If you need to allow this, set the
second constructor argument to `true`.

```php
#[IntegerSetting(42, true)]
```

### Nullable integer

The `Laniakea\Settings\Types\NullableIntegerSetting` is a `nullable` version of `IntegerSetting`. It accepts default
value as first argument, but in this case it can be `null`. It also supports parsing from strings (as second argument).

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\NullableIntegerSetting;

enum ExampleSetting: string
{
    #[NullableIntegerSetting(null, true)]
    case NULLABLE_INTEGER_SETTING = 'nullable_integer_setting';
}
```

## JSON

The `Laniakea\Settings\Types\JsonSetting` allows you to store any JSON-serializable values (`array`, `\stdClass` or `\JsonSerializable`).

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\JsonSetting;

enum ExampleSetting: string
{
    #[JsonSetting(['foo' => 'bar'])]
    case JSON_SETTING = 'json_setting';
}
```

### Default value

Default value of `JsonSetting` can be array, instance of `\stdClass` or instance of `\JsonSerializable`.

### Encoding

`$encodeFlags` and `$encodeDepth` are optional arguments that can be used to customize the encoding process. By default
encode flags are set to `0` and depth is set to `512`.

These values are directly passed to `json_encode` function before saving settings to database.

```php
#[JsonSetting(['foo' => 'bar'], encodeFlags: JSON_PRETTY_PRINT, encodeDepth: 128)]
```

### Decoding

`$decodeAssociative`, `$decodeFlags` and `$decodeDepth` are optional arguments that can be used to customize the decoding process.
By default `null` is used for associative decoding, decode flags are set to `0` and depth is set to `512`.

These values are directly passed to `json_decode` function after retrieving settings from database.

```php
#[JsonSetting(['foo' => 'bar'], decodeAssociative: true, decodeDepth: 128)]
```

### Nullable JSON

The `Laniakea\Settings\Types\NullableJsonSetting` is a `nullable` version of `JsonSetting`. It accepts default
value as first argument, but in this case it can be `null`.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\NullableJsonSetting;

enum ExampleSetting: string
{
    #[NullableJsonSetting(null)]
    case NULLABLE_JSON_SETTING = 'nullable_json_setting';
}
```

`NullableJsonSetting` also supports the same encoding and decoding options.

## Possible value

The `Laniakea\Settings\Types\PossibleValueSetting` allows you to store one of the possible values. It acts 
like an `EnumSetting` but without sticking to the enum class.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\PossibleValueSetting;

enum ExampleSetting: string
{
    #[PossibleValueSetting('first', ['first', 'second', 'third'])]
    case POSSIBLE_VALUE_SETTING = 'possible_value_setting';
}
```

### Default value

The first argument of this setting is the default value – it can be any value from the list of allowed values.

### Allowed values

The second argument of this setting is the list of allowed values. Upon setting the value, it will be validated against
this list and only allowed values will be saved.

## String

The `Laniakea\Settings\Types\StringSetting` allows you to store string values.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\StringSetting;

enum ExampleSetting: string
{
    #[StringSetting('Hello, world')]
    case STRING_SETTING = 'string_setting';
}
```

### Default value

The first argument of this setting is the default value – it can be any string.

### Empty strings

By default this setting won't validate empty strings. If you need to allow empty strings, set the second constructor argument
to `true`.

```php
#[StringSetting('', true)]
```

::: tip
This will allow only empty strings – `null` values are not empty strings, so they won't be validated. 
Use `NullableStringSetting` instead.
:::

### Nullable string

The `Laniakea\Settings\Types\NullableStringSetting` is a `nullable` version of `StringSetting`. It accepts default
value as first argument, but in this case it can be `null`.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\Types\NullableStringSetting;

enum ExampleSetting: string
{
    #[NullableStringSetting(null)]
    case NULLABLE_STRING_SETTING = 'nullable_string_setting';
}
```

This setting also supports empty strings validation by setting the second argument to `true`.

## Custom settings

You can create your own settings types by implementing the `Laniakea\Settings\Interfaces\SettingAttributeInterface`
interface on your attribute.

```php
<?php

declare(strict_types=1);

namespace App\Settings\Types;

use Laniakea\Settings\Interfaces\SettingAttributeInterface;

#[\Attribute]
class EmployeeDepartmentSetting implements SettingAttributeInterface
{
    private array $departments = [
        'admin' => ['admin', 'hr', 'it', 'finance', 'support'],
        'user' => ['it', 'marketing', 'support'],
    ];

    public function __construct(
        private readonly ?string $defaultRole = null,
        private readonly ?string $defaultDepartment = null
    ) {
        //
    }

    public function getDefaultValue(): ?array
    {
        if (is_null($this->defaultRole) || is_null($this->defaultDepartment)) {
            return null;
        }

        return [
            'role' => $this->defaultRole,
            'department' => $this->defaultDepartment,
        ];
    }

    public function isValid(mixed $value): bool
    {
        // The $value must be an array with 'role' and 'department' keys.
        if (is_null($value)) {
            return false;
        } elseif (empty($value['role'] ?? null)) {
            return false;
        } elseif (empty($value['department'] ?? null)) {
            return false;
        }

        // Let's say, we need to check if the department is valid for the role.

        if (!isset($this->departments[$value['role']])) {
            return false;
        }

        return in_array($value['department'], $this->departments[$value['role']]);
    }

    public function toPersisted(string $key, mixed $value, array $settings): array
    {
        return [
            $key => json_encode([
                'role' => $value['role'] ?? null,
                'department' => $value['department'] ?? null,
            ]),
        ];
    }

    public function fromPersisted(string $key, mixed $value, array $settings): array
    {
        $decoded = json_decode($value, true);

        return [
            $key => [
                'role' => $decoded['role'] ?? null,
                'department' => $decoded['department'] ?? null,
            ],
        ];
    }
}
```

### Default value 

The `getDefaultValue()` method must return the default value of the setting. In custom settings you're free to
return any value you want.

### Validation

The `isValid()` method must validate provided value (by your custom logic) and either return `true` or `false`.

### Saving

The `toPersisted()` method must return an array with the key-value pair that will be saved into the database.

If your setting uses only one key, you can use the `$key` variable, which represents the setting name. Otherwise,
you can add as many keys as you need – just make sure they don't overlap with other settings.

The `$settings` argument holds values of all other settings that were passed to the [decorator](/settings#decorator)'s 
`update()` or `fill()` method.

### Restoring

The `fromPersisted()` method must return an array with the key-value pair that will be used as the setting value. 
Similarly to the `toPersisted()` method, if your setting uses only one key, you can use the `$key` variable,
which represents the setting name. Otherwise, you can add as many keys as you need.

The `$settings` argument holds values of all other settings that were retrieved from the database.

::: tip
Don't forget to mark your setting type as [PHP attribute](https://www.php.net/manual/en/language.attributes.overview.php)
by placing `#[\Attribute]` before the class definition.
:::

### Usage

Now you can use your custom setting in the settings enum, just like any other setting type.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use App\Settings\Types\EmployeeDepartmentSetting;

enum ExampleSetting: string
{
    #[EmployeeDepartmentSetting('user', 'it')]
    case ROLE_AND_DEPARTMENT = 'role_and_department';
}
```

It also available in settings decorator.

```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Laniakea\Settings\SettingsDecorator;

class UserSettingsDecorator extends SettingsDecorator
{
    public function getDepartment(): ?string
    {
        return $this->getValue(ExampleSetting::ROLE_AND_DEPARTMENT)['department'] ?? null;
    }

    public function getRole(): ?string
    {
        return $this->getValue(ExampleSetting::ROLE_AND_DEPARTMENT)['role'] ?? null;
    }
}
```

And you can update this setting by passing value that would be validated by your rules.

```php
$user->getSettingsDecorator()->fill([
    ExampleSetting::ROLE_AND_DEPARTMENT->value => [
        'role' => 'admin',
        'department' => 'hr',
    ],
]);
```
