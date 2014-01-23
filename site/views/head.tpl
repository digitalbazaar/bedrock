<!DOCTYPE html>
<html prefix="
  xhv: http://www.w3.org/1999/xhtml/vocab#
  xsd: http://www.w3.org/2001/XMLSchema#
  rdfs: http://www.w3.org/2000/01/rdf-schema#
  dc: http://purl.org/dc/terms/
  foaf: http://xmlns.com/foaf/0.1/
  bed: https://w3id.org/bedrock#
  sec: https://w3id.org/security#
  vcard: http://www.w3.org/2006/vcard/ns#
  v: http://rdf.data-vocabulary.org/#
  "{{! debug="true"}}>

  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {{verbatim}}
    <title data-ng-bind="(pageTitle && (siteTitle + ': ' + pageTitle)) || siteTitle"></title>
    {{/verbatim}}
    <link href="https://fonts.googleapis.com/css?family=Droid+Sans:400,700" rel="stylesheet" type="text/css">
    {{if productionMode}}
      <link href="/css/bundle.min.css" rel="stylesheet" type="text/css" />
    {{else}}
      {{if minify}}
        <link href="/css/bundle.min.css" rel="stylesheet" type="text/css" />
      {{else}}
        <link href="/bootstrap/css/bootstrap.css" rel="stylesheet" type="text/css" />
        <link href="/bootstrap/css/bootstrap-responsive.css" rel="stylesheet" type="text/css" />
        <link href="/font-awesome/css/font-awesome.css" rel="stylesheet" type="text/css" />
        <link href="/css/common.css" rel="stylesheet" type="text/css" />
        <link href="/css/custom.css" rel="stylesheet" type="text/css" />
      {{/if}}
    {{/if}}
    <!--[if IE]>
    <link href="/css/ie.css" rel="stylesheet" type="text/css" />
    <![endif]-->

    <link rel="shortcut icon" href="/favicon.ico" />

    {{if pageLayout != "error"}}
      {{if productionMode}}
        <script src="/app/main.min.js"></script>
      {{else}}
        {{if minify}}
          <script src="/app/main.min.js"></script>
        {{else}}
          <script data-main="/app/main.js" src="/requirejs/require.js"></script>
        {{/if}}
      {{/if}}
    {{/if}}
  </head>

  <body>
    {{if pageLayout == "error"}}
      {{partial "navbar-plain.tpl"}}
    {{else}}
      {{if session.auth}}
        {{partial "navbar-private.tpl"}}
      {{else}}
        {{partial "navbar-public.tpl"}}
      {{/if}}
    {{/if}}

    {{if userAgent.obsolete}}
    <div class="alert alert-error">
      Your browser (${userAgent.family} ${userAgent.major}) is <strong>out of date</strong>.
      Please <a href="http://www.updateyourbrowser.net/">update your browser.</a>
    </div>
    {{/if}}

    <div class="container ng-cloak">

      {{! Javascript warning }}
      <noscript>
        <div class="alert alert-error">
          <p>Javascript must be enabled to use this site.</p>
        </div>
      </noscript>

      {{if pageLayout != "error"}}
      {{partial "data.tpl"}}
      {{/if}}
