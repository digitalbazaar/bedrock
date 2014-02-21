${set([
  pageTitle = "Identity",
  clientData.pageTitle = "Identity"
])}
{{partial "head.tpl"}}

<div about="" typeof="ps:${identity.type}" class="row">
  <div class="span12">
{{if identity.label}}
    <h1 class="headline">
      About <span property="rdfs:label">${identity.label}</span>
    </h1>
{{else}}
    <h1 class="headline">About Identity</h1>
{{/if}}
  </div>
</div>

{{if identity.website || identity.description}}
<hr />
{{/if}}
{{if identity.website}}
<div class="row">
  <div class="span4 offset4">
    <h2>Website</h2>
    <a property="foaf:homepage" href="${identity.website}">
      ${identity.website}
    </a>
  </div>
</div>
{{/if}}
{{if identity.website && identity.description}}
<div class="row">
  <div class="span12">&nbsp;</div>
</div>
{{/if}}
{{if identity.description}}
<div class="row">
  <div class="span4 offset4">
    <h2>Description</h2>
    <p></p>
    <p property="dc:description">${identity.description}</p>
  </div>
</div>
{{/if}}

<hr />

<div class="row">
  <div class="span4 offset4">
    <h2>Cryptographic Keys</h2>
{{if keys.length > 0}}
  <ul>
  {{each(idx,value) keys}}
    <li>
      <a about="" rel="sec:publicKey" href="${keys[idx].id}">
        <span property="rdfs:label">${keys[idx].label}</span>
      </a>
      <span about="${keys[idx].id}" typeof="sec:CryptographicKey">
        <link rel="sec:owner" href="" />
      </span>
    </li>
  {{/each}}
  </ul>
{{else}}
    <p>No publicly visible keys.</p>
{{/if}}
  </div>
</div>

{{partial "foot.tpl"}}
