${set([
  pageTitle = "Help",
  clientData.pageTitle = "Help"
])}
{{partial "head.tpl"}}

<div class="row">
  <div class="span12">
    <h1>${pageTitle}</h1>
  </div>
</div>

<div class="row">
  <div class="section span12">
    <h2 class="headline">${siteTitle}</h2>
  </div>
</div>

<div class="row">
  <div class="span10 offset1">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/legal#tos">Terms of Service</a></li>
      <li><a href="/legal#pp">Privacy Policy</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </div>
</div>

<div class="row">
  <div class="section span12">
    <h2 id="developers" class="headline">Developers</h2>
  </div>
</div>

<div class="row">
  <div class="span10 offset1">
    <ul>
      <!--<li><a href="/docs">Developer Documentation</a></li>-->
      <li><a href="http://json-ld.org/">JSON-LD</a>: JSON-LD information, libraries, and tools. This linked data representation format is used throughout PaySwarm based systems.</li>
      <li><a href="http://rdfa.info/">RDFa</a>: RDFa information, libraries, and tools. RDFa can be used to markup asset and listing data in webpages.</li>
    </ul>
  </div>
</div>

{{partial "foot.tpl"}}
