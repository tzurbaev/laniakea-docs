# Forms

Laniakea provides very basic functionality for creating forms and its fields. It is not a full-featured form builder and
it doesn't have any frontend-specific solutions for rendering forms.

However, you can serialize your forms and fields to JSON for further processing on the frontend.

## What is a form

The Laniakea form is a set of action-related things (HTTP method, URL, and HTTP headers), fields, field sections,
buttons, errors and messages, and some additional settings.

This set allows you to generate forms on backend and then use its JSON representation on frontend to render
your forms in a way you want.

::: tip
While Laniakea uses its own JSON structure for forms, it's possible to modify it and make it work with your frontend
app or any frontend forms library of your choice.
:::

## Creating forms

To create a form, you should either implement the `Laniakea\Forms\Interfaces\FormInterface` interface or extend the
`Laniakea\Forms\AbstractForm` class that has a partial implementation of the interface.

::: tip
Once again, the forms components are strictly **backend-only** and don't have any UI included. It's up to you how
to use the serialized form on the frontend or maybe not use it at all.
:::

## Form method

The `getMethod()` method should return the HTTP method (GET, POST, PUT, PATCH, DELETE) that should be used to submit the form.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Laniakea\Forms\AbstractForm;

class EditUserProfileForm extends AbstractForm
{
    public function getMethod(): string
    {
        return 'POST';
    }
}
```

## Form action URL

The `getAction()` method should return the URL where the form should be submitted.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Laniakea\Forms\AbstractForm;

class EditUserProfileForm extends AbstractForm
{
    public function getUrl(): string
    {
        return '/user/profile';
    }
}
```

## Form fields

The `getFields()` method should return an array of form fields. Each field should be an instance of the
`Laniakea\Forms\Interfaces\FormFieldInterface` interface. The associative array key will be used as the field name
during serialization.

You can check list of available fields and how to create custom fields in the [Form Fields](/forms/fields) article.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Laniakea\Forms\AbstractForm;
use Laniakea\Forms\Fields\TextField;

class EditUserProfileForm extends AbstractForm
{
    public function getFields(): array
    {
        return [
            'name' => (new TextField('Your Name'))
                ->setHint('Will be visible only to you.')
                ->setAttribute('required', true),

            'email' => (new TextField('Email'))
                ->setInputType('email')
                ->setHint('Will be visible only to you.')
                ->setAttribute('required', true),

            'new_password' => (new TextField('New Password'))
                ->setInputType('password')
                ->setHint('Leave empty if you don\'t want to change your password.'),
        ];
    }
}
```

## Form values

The `getValues()` method should return an array of default values for the form fields. The associative array key should
match the field name.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Illuminate\Support\Facades\Auth;
use Laniakea\Forms\AbstractForm;

class EditUserProfileForm extends AbstractForm
{
    public function getValues(): array
    {
        $user = Auth::user();

        return [
            'name' => $user->name,
            'email' => $user->email,
            'password' => null,
        ];
    }
}
```

## Form sections

The `getSections()` method should return an array of form sections. Each section should be either an instance of the
`Laniakea\Forms\Interfaces\FormSectionInterface` interface or the `Laniakea\Forms\FormSection` class (that implements the interface).

`Laniakea\Forms\FormSection`'s constructor accepts array of field names, and optional label, description and section ID. 

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Laniakea\Forms\AbstractForm;
use Laniakea\Forms\FormSection;

class EditUserProfileForm extends AbstractForm
{
    public function getSections(): array
    {
        return [
            new FormSection(
                fieldNames: ['name', 'email', 'new_password'],
                label: 'Personal Information',
                description: 'Update your personal information.',
                id: 'personal-information',
            ),
        ];
    }
}
```

The only required argument is `$fieldNames`. The rest of the arguments are optional.

## Form buttons

The `getButtons()` method should return an array of form buttons. Each button should be an instance of the
`Laniakea\Forms\Interfaces\FormButtonInterface` interface. You can use `Laniakea\Forms\FormButton` class that is an implementation of the interface.

The `FormButton`'s constructor accepts button type and optional label, url, and additional settings. The first
argument, button type, must be a case of the `Laniakea\Forms\Enums\FormButtonType` enum.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use Laniakea\Forms\AbstractForm;
use Laniakea\Forms\Enums\FormButtonType;
use Laniakea\Forms\FormButton;

class EditUserProfileForm extends AbstractForm
{
    public function getButtons(): array
    {
        return [
            new FormButton(FormButtonType::SUBMIT, label: 'Save Changes'),
            new FormButton(FormButtonType::LINK, label: 'Cancel', url: '/'),
        ];
    }
}
```

## Usage

So, now you have a form class but how to use it on frontend? Well, that's up to you. You can serialize it to JSON by
using [forms manager](/forms/manager) and then pass it to your frontend application.

If you already have some frontend solution for rendering forms, you can write your own forms manager and use
it instead of provided one, so your JSON schema will match your frontend requirements.
