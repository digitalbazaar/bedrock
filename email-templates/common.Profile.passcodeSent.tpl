To: {{email}}
From: "{{serviceName}} Customer Support" <support@{{supportDomain}}>
Subject: {{profileSubjectPrefix}}Your {{serviceName}} passcode

{% if usage === "reset" -%}
You requested a passcode so you could reset your {{serviceName}} password.
If you did not make this request, simply ignore this email and your password
will not be changed.
{%- else -%}
You requested a passcode so you could verify your {{serviceName}} email
address.
{%- endif %}

You may visit the following page and enter your code manually:

https://{{serviceHost}}/profile/passcode

{%- if profiles.length == 1 %}

Your passcode is: {{profiles[0].psaPasscode}}

{%- else %}

Since you have multiple profiles with the same email address, we sent you
passcodes for each one:
{%- for profile in profiles -%}
{%- if profile.identity %}

Identity:  {{profile.identity.label}}
{%- else %}

Profile:   {{profile.psaSlug}}
{%- endif %}
Passcode: {{profile.psaPasscode}}
{%- endfor -%}
{%- endif %}

If you have any questions or comments please contact support@{{supportDomain}}.
