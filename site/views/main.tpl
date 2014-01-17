${set([
  pageTitle = "Bedrock App"
])}
{{partial "head.tpl"}}

<div class="container ng-cloak">
  <div data-ng-view></div>
</div>

<div data-ng-include="'/app/templates/demo-warning.html'"></div>

{{partial "foot.tpl"}}
