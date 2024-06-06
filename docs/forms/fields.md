# Form Fields

Laniakea provides few built-in form fields that you can use in your forms. Each field extends the
`Laniakea\Forms\AbstractFormField` class and implements the `Laniakea\Forms\Interfaces\FormFieldInterface` interface.

## Abstract field

The `Laniakea\Forms\AbstractFormField` class is the base class for all form fields. It provides additional methods to the
`Laniakea\Forms\Interfaces\FormFieldInterface` interface for more convenient field creation.

### Available setters

- `setId(string $id)` – assigns identifier to the field. If field has no ID, [forms manager](/forms/manager) will
generate random one during serialization;
- `setLabel(string $label)` – assigns label to the field. While it's possible to set label directly in the field constructor,
this method allows to change label after field creation;
- `setHint(string $hint)` – assigns hint to the field;
- `setAttribute(string $key, mixed $value)` – assigns single attribute to the field;
- `setAttributes(array $attributes)` – assigns multiple attributes to the field;
- `setSetting(string $key, mixed $value)` – assigns setting to the field. Settings can be used on
frontend to customize field behavior;
- `setSettings(array $settings)` – assigns multiple settings to the field;
- `setReadOnly(bool $readOnly = true)` – sets field as read-only (shortcut for `setAttribute('readonly', true)`);
- `setDisabled(bool $disabled = true)` – sets field as disabled (shortcut for `setAttribute('disabled', true)`);
- `setRequired(bool $required = true)` – sets field as required (shortcut for `setAttribute('required', true)`).

## Text field

The `Laniakea\Forms\Fields\TextField` class represents a simple text input field. It extends the `Laniakea\Forms\AbstractFormField`
and provides field-specific methods:

- `setInputType(string $type)` – sets input type attribute. If this method was not called during field creation, the
input type will be set to `text`;
- `setMinValue(mixed $length)` – sets the `min` attribute for the field;
- `setMaxValue(mixed $length)` – sets the `max` attribute for the field;
- `setStep(mixed $step)` – sets the `step` attribute for the field.

### Example {#text-example}

```php
<?php

use Laniakea\Forms\Fields\TextField;

$field = new TextField('Precision');

$field->setHint('Enter the precision value (from 0.1 to 10.0).')
    ->setInputType('number')
    ->setRequired()
    ->setMinValue(0.1)
    ->setMaxValue(10)
    ->setStep(0.1)
    ->setAttribute('autocomplete', 'off')
    ->setSetting('precision_hints', [
        '0.1' => 'Lowest precision',
        '3.0' => 'Recommended precision',
        '10.0' => 'Highest precision',
    ]);
```

## Textarea field

The `Laniakea\Forms\Fields\TextareaField` class represents a textarea (multi-row text input). It extends the
`Laniakea\Forms\AbstractFormField` and provides field-specific methods:

- `setRows(int $rows)` – sets the number of rows for the textarea;
- `setCols(int $cols)` – sets the number of columns for the textarea.

### Example {#textarea-example}

```php
<?php

use Laniakea\Forms\Fields\TextareaField;

$field = new TextareaField('Tell us about yourself');

$field->setHint('Write a few words about yourself.')
    ->setRows(10)
    ->setCols(30)
    ->setAttribute('resize', 'none')
    ->setRequired();
```

## Select field

The `Laniakea\Forms\Fields\SelectField` class represents a select field. It extends the
`Laniakea\Forms\Fields\AbstractFormFieldWithOptions` (which extends the `Laniakea\Forms\AbstractFormField`) and provides
field-specific methods:

- `setOptions(array $options)` – sets the list of options for the select field.

::: tip
The options list can be in any format that your frontend can understand. It can be simple key-value array or
more complex structure like nested objects (with `id` and `name` fields for example).

It is also possible to set options using the second argument of the field constructor.
:::

### Example {#select-example}

```php
<?php

use Laniakea\Forms\Fields\SelectField;

// Set options using constructor
$field = new SelectField('Time zone', timezone_identifiers_list());

$field->setHint('Choose time zone you\'re in. It will affect all times and dates in CMS.')
    ->setRequired();

// Set options using setter
$field->setOptions(timezone_identifiers_list());
```

## Radio field

The `Laniakea\Forms\Fields\RadioGroupField` class represents a radio field. It extends the
`Laniakea\Forms\Fields\AbstractFormFieldWithOptions` (which extends the `Laniakea\Forms\AbstractFormField`) and provides
field-specific methods:

- `setOptions(array $options)` – sets the list of options for the select field.

::: tip
The options list can be in any format that your frontend can understand. It can be simple key-value array or
more complex structure like nested objects (with `id` and `name` fields for example).

It is also possible to set options using the second argument of the field constructor.
:::

### Example {#radio-example}

```php
<?php

use Laniakea\Forms\Fields\RadioGroupField;

// Set options using constructor
$field = new RadioGroupField('Notifications Frequency', [
    'daily' => 'Daily',
    'weekly' => 'Weekly',
    'monthly' => 'Monthly',
    'never' => 'Never',
]);

$field->setHint('Choose how often you want to receive notifications.')
    ->setRequired();

// Set options using setter
$field->setOptions([
    'daily' => 'Daily',
    'weekly' => 'Weekly',
    'monthly' => 'Monthly',
    'never' => 'Never',
]);
```


## Checkbox field

The `Laniakea\Forms\Fields\CheckboxField` class represents a checkbox field. It extends the `Laniakea\Forms\AbstractFormField`
and does not provide any field-specific methods.

### Example {#checkbox-example}

```php
<?php

use Laniakea\Forms\Fields\CheckboxField;

$field = new CheckboxField('I accept the terms and conditions');

$field->setHint('Please read the terms and conditions before accepting.')
    ->setAttribute('value', 'tos_accepted');
```

## Toggle field

The `Laniakea\Forms\Fields\ToggleField` class represents a toggle field. It extends the `Laniakea\Forms\AbstractFormField`
and does not provide any field-specific methods.

### Example {#toggle-example}

```php
<?php

use Laniakea\Forms\Fields\ToggleField;

$field = new ToggleField('Dark mode');

$field->setHint('Toggle to enable dark mode in admin panel.');
```

## Hidden field

The `Laniakea\Forms\Fields\HiddenField` class represents a hidden field. It extends the `Laniakea\Forms\AbstractFormField`
and does not provide any field-specific methods.

### Example {#hidden-example}

```php
<?php

use Laniakea\Forms\Fields\HiddenField;

$field = new HiddenField('user_id');
```

## Custom fields

You can easily create custom fields by extending the `Laniakea\Forms\AbstractFormField` class. Please read more
in the [Custom form fields](/forms/fields/custom) article.
