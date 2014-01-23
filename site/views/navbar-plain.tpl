<div data-ng-controller="NavbarCtrl" class="navbar ng-cloak">
  <div class="navbar-inner navbar-inner-banner">
    <div class="container">
      <a href="/">
        {{if style.brand.src}}
        <img class="brand-minimal" src="${style.brand.src}" width="${style.brand.width}" height="${style.brand.height}" alt="${style.brand.alt}" />
        {{else}}
        ${siteTitle}
        {{/if}}
      </a>
    </div>
  </div>
</div>
