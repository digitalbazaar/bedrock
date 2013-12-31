To: registration@{{supportDomain}}
From: cluster@{{supportDomain}}
Subject: {{subjectPrefix}}{{serviceName}} Profile created: {{profile.psaSlug}} ({{profile.id}})

Machine:        {{machine}}
Profile ID:     {{profile.id}}
Profile Email:  {{profile.email}}
Identity ID:    {{identity.id}}
Identity Label: {{identity.label}}

-----BEGIN PROFILE-----
{{toJson(profile)}}
-----END PROFILE-----
-----BEGIN IDENTITY-----
{{toJson(identity)}}
-----END IDENTITY-----
