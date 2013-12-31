${set([
  pageTitle = "Identity Settings",
  inav = "settings"
])}

{{partial "head.tpl"}}

{{verbatim}}
<div class="ng-cloak">

<div class="container">

  <div class="row">
    <div class="title-section span12">
      <h1 class="headline">Settings</h1>
    </div>
  </div>

  <div class="tabbable tabs-left first-tabbable">
    <ul class="nav nav-tabs">
      <li class="active"><a href="#keys" data-toggle="tab">Access Keys</a></li>
    </ul>
    <div class="tab-content">

      <!-- Keys Tab -->
      <div class="container-fluid tab-pane"
        id="keys"
        data-ng-controller="KeySettingsCtrl">
        <div class="row-fluid">
          <div class="section span12">
            <h3 class="headline">
              Keys
              <span data-ng-show="state.loading" class="pull-right">
                <span data-spinner="state.loading" data-spinner-class="h3-spinner"></span>
              </span>
            </h3>
            <table class="table table-condensed" data-ng-show="state.loading || keys.length > 0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Edit</th>
                  <th>Revoke</th>
                </tr>
              </thead>
              <tbody>
                <tr data-ng-repeat="key in keys | orderBy:'label' | orderBy:'psaStatus':reverse">
                  <!-- Name -->
                  <td>
                    <a href="{{key.id}}">{{key.label}}</a>
                  </td>
                  <!-- Status -->
                  <td>
                    <span data-ng-show="key.psaStatus == 'disabled'">Revoked</span>
                    <span data-ng-show="key.psaStatus == 'active'">Active</span>
                  </td>
                  <!-- Edit -->
                  <td class="action">
                    <button class="btn" title="Edit" data-ng-click="editKey(key)"><i class="icon-pencil"></i></button>
                  </td>
                  <!-- Revoke -->
                  <td class="action">
                    <button class="btn btn-danger" title="Revoke" data-ng-hide="key.psaStatus == 'disabled'" data-ng-click="revokeKey(key)"><i class="icon-remove icon-white"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div data-ng-show="!state.loading && keys.length == 0">
              <p class="center">You have no keys associated with this identity.
              Access keys can be added by using an external website or application.</p>
            </div>
          </div>
        </div>
        <!-- Revoking key alert -->
        <div data-modal-alert="modals.showRevokeKeyAlert"
          data-modal-header="Warning"
          data-modal-ok="Revoke"
          data-modal-cancel="Cancel"
          data-modal-on-close="confirmRevokeKey(err, result)">
          <div class="center alert">
            <strong>Warning!</strong>
            Revoking an access key is permanent.
          </div>
          <p>Any items that you have listed for sale using this key will be
          invalidated and any applications that use this key will be disabled.
          You can relist your items or re-enable your applications by
          registering a new key.</p>
          <p>Are you sure that you want to revoke this key?</p>
        </div>
        <div data-modal-edit-key="modals.showEditKey"
          data-key="modals.key"></div>
        </div>
      </div>
      <!-- End Keys Tab -->

    </div>
  </div>
</div>
{{/verbatim}}

{{partial "demo-warning.tpl"}}

{{partial "foot.tpl"}}

</div>
