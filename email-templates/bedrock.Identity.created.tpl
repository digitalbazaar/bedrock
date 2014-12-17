To: {{registration.email}}
From: "{{service.name}} {{system.name}}" <{{system.email}}>
Subject: {{subject.prefix}}{{service.name}} Identity created: {{identity.sysSlug}} ({{identity.id}})

Machine:        {{machine}}
Identity ID:    {{identity.id}}
Identity Email: {{identity.email}}
Identity Label: {{identity.label}}

-----BEGIN IDENTITY-----
{{toJson(identity)}}
-----END IDENTITY-----
