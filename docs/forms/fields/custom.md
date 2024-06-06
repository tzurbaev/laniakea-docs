# Custom form fields

Due to limited number of [built-in fields](/forms/fields), you may want to create your own field. To do this, you need to create a class
that extends the `Laniakea\Forms\AbstractFormField` (or implements the `Laniakea\Forms\Interfaces\FormFieldInterface`
interface).

## Custom field type

Classes that extends from the `Laniakea\Forms\AbstractFormField` require you to implement the `getType()` method.
This method should return a unique field type that your frontend can understand.

For example, all built-in fields uses the `{type}Field` naming convention. If you create a custom field for a color picker,
you can return string `ColorPickerField` from the `getType()` method.

```php
<?php

declare(strict_types=1);

namespace App\Forms\Fields;

use Laniakea\Forms\AbstractFormField;

class ColorPickerField extends AbstractFormField
{
    public function getType(): string
    {
        return 'ColorPickerField';
    }
}
```

## Default settings

You can set default settings for your custom field by overriding the `getDefaultSettings()` method. This method should
return an array of settings that are required by your frontend implementation of the field.

Also it might be useful to provide field-specific methods to override such default settings.

```php
<?php

declare(strict_types=1);

namespace App\Forms\Fields;

use Laniakea\Forms\AbstractFormField;

class ColorPickerField extends AbstractFormField
{
    public function getType(): string
    {
        return 'ColorPickerField';
    }

    protected function getDefaultSettings(): array
    {
        return [
            'format' => 'hex',
        ];
    }

    /**
     * This method will override the default `format` setting.
     */
    public function setFormat(string $format): static
    {
        return $this->setSetting('format', $format);
    }
}
```

## Default attributes

You can also set default attributes for your custom field by overriding the `getDefaultAttributes()` method. This method
should return an array of attributes that are required by your frontend implementation of the field.

Also it might be useful to provide field-specific methods to override such default attributes.

```php
<?php

declare(strict_types=1);

namespace App\Forms\Fields;

use Laniakea\Forms\AbstractFormField;

class ColorPickerField extends AbstractFormField
{
    public function getType(): string
    {
        return 'ColorPickerField';
    }

    protected function getDefaultAttributes(): array
    {
        return [
            'data-picker-type' => 'chrome',
        ];
    }

    /**
     * This method will override the default `data-picker-type` attribute.
     */
    public function setPickerType(string $type): static
    {
        return $this->setAttribute('data-picker-type', $type);
    }
}
```

## Settings & attributes merging

Both settings and attributes will be merged together during the serialization by the [forms manager](/forms/manager).
Any user-defined settings or attributes will override the default ones. Merging is performed by the spread operator 
(`...`), so only the top-level keys will be merged.

