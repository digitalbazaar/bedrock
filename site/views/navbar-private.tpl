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
            <li data-ng-repeat="item in nav" data-ng-class="{active: pageTitle == item.pageTitle}"><a href="{{session.identity.id}}/{{item.slug}}"><i class="{{item.icon}}"></i> {{item.label}}</a></li>
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
