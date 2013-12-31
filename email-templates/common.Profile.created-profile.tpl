To: {{profile.email}}
From: "{{serviceName}} Customer Support" <support@{{supportDomain}}>
Subject: {{profileSubjectPrefix}}Welcome to {{serviceName}}!

{% if productionMode == false %}
*******
NOTE: This is a demonstration website notification.
More info is available at http://bedrock.dev/wiki/Demo_Warning.
*******

{% endif -%}
Hello {{identity.label}},

Welcome to {{serviceName}}!

We're so glad you joined! Please let us know if there is anything that we
can do to help you settle into the website.

You can manage your profile and other settings by going here:

{{identity.id}}/dashboard

We'd love to hear any feedback you have about {{serviceName}}.
Just send an email to comments@{{supportDomain}}.

If you have any questions or comments please contact support@{{supportDomain}}.
