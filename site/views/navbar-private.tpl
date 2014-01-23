<div data-ng-controller="NavbarCtrl" class="navbar ng-cloak">
  <div class="navbar-inner navbar-inner-banner">
    <div class="container">
      {{if session.loaded && session.identity.owner == session.profile.id}}
        {{if pageLayout == "normal"}}
          <a class="brand" href="/">
            {{if style.brand.src}}
            <img src="${style.brand.src}" width="${style.brand.width}" height="${style.brand.height}" alt="${style.brand.alt}" />
            {{else}}
            ${siteTitle}
            {{/if}}
          </a>
          {{verbatim}}
          <ul class="nav">
            <li data-ng-class="{active: pageTitle == 'Dashboard'}"><a href="{{session.identity.id}}/dashboard"><i class="icon-dashboard"></i> Dashboard</a></li>
            <li data-ng-class="{active: pageTitle == 'Settings'}"><a href="{{session.identity.id}}/settings"><i class="icon-wrench"></i> Settings</a></li>
          </ul>
          {{/verbatim}}
        {{else}}
          <img class="brand-minimal" src="${style.brand.src}" width="${style.brand.width}" height="${style.brand.height}" alt="${style.brand.alt}" />
        {{/if}}
        {{verbatim}}
        <a class="btn btn-nav btn-small show pull-right{{showHovercard && ' active' || ''}}"
          data-popover-template="/app/templates/navbar-hovercard.html"
          data-popover-visible="showHovercard"
          data-title="{{session.identity.label || session.profile.label}}"
          data-placement="bottom">
        {{/verbatim}}
          <i class="icon-user"></i>
        </a>
        <a class="navbar-link pull-right" style="line-height:45px"
          data-ng-click="showHovercard=!showHovercard">
        {{if session.identity}}
          ${display(session.identity.label, "-")}
        {{else}}
          ${display(session.profile.label, "-")}
        {{/if}}
        </a>
      {{/if}}
    </div>
  </div>
</div>
