<div data-ng-controller="NavbarCtrl" class="navbar ng-cloak">
  <div class="navbar-inner navbar-inner-banner">
    <div class="container">
      {{if session.loaded && session.identity.owner == session.profile.id}}
        {{if pageLayout == "normal"}}
          <a class="brand" href="/"><img src="${cacheRoot}${style.brand.src}" width="${style.brand.width}" height="${style.brand.height}" alt="${style.brand.alt}" /></a>
          <ul class="nav">
            <li {{if inav == "dashboard"}}class="active"{{/if}}><a href="${session.identity.id}/dashboard"><i class="icon-dashboard"></i> Dashboard</a></li>
            <li {{if inav == "settings"}}class="active"{{/if}}><a href="${session.identity.id}/settings"><i class="icon-wrench"></i> Settings</a></li>
          </ul>
        {{else}}
          <img class="brand-minimal" src="${cacheRoot}${style.brand.src}" width="${style.brand.width}" height="${style.brand.height}" alt="${style.brand.alt}" />
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
