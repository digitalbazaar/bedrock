To: registration@{{supportDomain}}
From: cluster@{{supportDomain}}
Subject: {{subjectPrefix}}{{serviceName}} Identity created: {{identity.sysSlug}} ({{identity.id}})

Machine:        {{machine}}
Identity ID:    {{identity.id}}
Identity Email: {{identity.email}}
Identity Label: {{identity.label}}

-----BEGIN IDENTITY-----
{{toJson(identity)}}
-----END IDENTITY-----
