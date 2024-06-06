# Forms Manager

Forms Manager allows you to serialize your forms into JSON object for further usage in frontend applications.

## Default manager

Laniakea provides a default form manager that can be used to serialize forms into JSON object. It is bound to
Laravel's Service Container and can be accessed via `Laniakea\Forms\Interfaces\FormsManagerInterface` injection.

This interface has `getFormData` method that accepts a form instance and returns a PHP array and `getFormJson()` method
that accepts a form instance and returns a JSON string.

::: code-group
```php [UserProfileController.php]
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Forms\EditUserProfileForm;
use Illuminate\View\View;
use Laniakea\Forms\Interfaces\FormsManagerInterface;

class UserProfileController
{
    public function edit(FormsManagerInterface $formsManager): View
    {
        $formData = $formsManager->getFormData(new EditUserProfileForm());

        return view('users.edit', [
            'form' => $formData,
            // or if you need a JSON string, use getFormJson()
            'formJson' => $formsManager->getFormJson(new EditUserProfileForm()), 
        ]);
    }
}
```

```php [EditUserProfileForm.php]
<?php

declare(strict_types=1);

namespace App\Forms;

use Illuminate\Support\Facades\Auth;
use Laniakea\Forms\AbstractForm;
use Laniakea\Forms\Enums\FormButtonType;
use Laniakea\Forms\Fields\TextField;
use Laniakea\Forms\FormButton;
use Laniakea\Forms\FormSection;

class EditUserProfileForm extends AbstractForm
{
    public function getMethod(): string
    {
        return 'POST';
    }

    public function getUrl(): string
    {
        return '/user/profile';
    }

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

    public function getValues(): array
    {
        $user = Auth::user();

        return [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
        ];
    }

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

    public function getButtons(): array
    {
        return [
            new FormButton(FormButtonType::SUBMIT, label: 'Save Changes'),
            new FormButton(FormButtonType::LINK, label: 'Cancel', url: '/'),
        ];
    }
}
```
:::

The built-in forms manager (`Laniakea\Forms\FormsManager`) generates the array that can be encoded to the following 
JSON object:

::: details Click to expand JSON object
```json
{
  "form": {
    "id": "Form-kJdz2YdmBjmcRLw0",
    "layout": null,
    "method": "POST",
    "url": "/user/profile",
    "redirect_url": null,
    "headers": [],
    "buttons": [
      {
        "type": "submit",
        "label": "Save Changes",
        "url": null,
        "settings": []
      },
      {
        "type": "link",
        "label": "Cancel",
        "url": "/",
        "settings": []
      }
    ],
    "settings": [],
    "values": {
      "name": null,
      "email": null,
      "password": null
    },
    "errors": null
  },
  "sections": [
    {
      "id": "personal-information",
      "label": "Personal Information",
      "description": "Update your personal information.",
      "fields": [
        {
          "id": "Field-name-your-name",
          "type": "TextField",
          "name": "name",
          "label": "Your Name",
          "hint": "Will be visible only to you.",
          "settings": {
            "attributes": {
              "type": "text",
              "required": true
            }
          }
        },
        {
          "id": "Field-email-email",
          "type": "TextField",
          "name": "email",
          "label": "Email",
          "hint": "Will be visible only to you.",
          "settings": {
            "attributes": {
              "type": "email",
              "required": true
            }
          }
        },
        {
          "id": "Field-new-password-new-password",
          "type": "TextField",
          "name": "new_password",
          "label": "New Password",
          "hint": "Leave empty if you don't want to change your password.",
          "settings": {
            "attributes": {
              "type": "password"
            }
          }
        }
      ]
    }
  ]
}
```
:::

The `form` object contains the form's metadata, such as method, URL, buttons, and values. The `sections` array contains
the form's sections, each with its fields.

### Empty arrays and JSON objects

Please be aware that simple `json_encode` will convert empty PHP arrays to empty JSON arrays (`[]`) and not to empty
objects (`{}`).

If you're using frontend frameworks like Vue or React, their validators might not work correctly with empty arrays when
they expect an object.

In this case please use `getFormJson()` method to get a JSON string representation of the form. It correctly handles
empty arrays and converts them to empty objects. It **does not** convert empty array inside settings to empty objects.

::: details Click to see output of `getFormJson` method
```json
{
  "form": {
    "id": "Form-nh42FvgOxilkEeuA",
    "layout": null,
    "method": "POST",
    "url": "/user/profile",
    "redirect_url": null,
    "headers": {},
    "buttons": [
      {
        "type": "submit",
        "label": "Save Changes",
        "url": null,
        "settings": {}
      },
      {
        "type": "link",
        "label": "Cancel",
        "url": "/",
        "settings": {}
      }
    ],
    "settings": {},
    "values": {
      "name": null,
      "email": null,
      "password": null
    },
    "errors": null
  },
  "sections": [
    {
      "id": "personal-information",
      "label": "Personal Information",
      "description": "Update your personal information.",
      "fields": [
        {
          "id": "Field-name-your-name",
          "type": "TextField",
          "name": "name",
          "label": "Your Name",
          "hint": "Will be visible only to you.",
          "settings": {
            "attributes": {
              "type": "text",
              "required": true
            }
          }
        },
        {
          "id": "Field-email-email",
          "type": "TextField",
          "name": "email",
          "label": "Email",
          "hint": "Will be visible only to you.",
          "settings": {
            "attributes": {
              "type": "email",
              "required": true
            }
          }
        },
        {
          "id": "Field-new-password-new-password",
          "type": "TextField",
          "name": "new_password",
          "label": "New Password",
          "hint": "Leave empty if you don't want to change your password.",
          "settings": {
            "attributes": {
              "type": "password"
            }
          }
        }
      ]
    }
  ]
}
```
:::

As you can see, all empty `settings` arrays are now represented as empty objects.

## Override forms manager

If you need to customize the serialization process, you can create your own forms manager by implementing
`Laniakea\Forms\Interfaces\FormsManagerInterface` interface on your serializer.

Please note that if you want to use `FormsManagerInterface` injection instead of your custom manager, you need to instruct
Laniakea to use your manager instead of the default one.

To do so, please refer to the [bindings configuration](/configuration#bindings) and replace default forms manager
implementation with your own. After this you can inject `FormsManagerInterface` into your controllers and services.

## Identifiers generation

Forms, form fields, and form sections have methods and/or constructor arguments to set their identifiers. If you don't
provide an identifier, Laniakea will generate a unique identifier for you.

The default forms manager uses instance of `Laniakea\Forms\Interfaces\FormIdsGeneratorInterface` to generate identifiers.

If this default generator does not suit your needs, you can create your own generator by implementing that interface
and [binding it](/configuration#bindings) to the container.
