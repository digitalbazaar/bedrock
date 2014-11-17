/*!
 * Form library service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define(['angular', 'jsonld'], function(angular, jsonld) {

'use strict';

// cache jsonld promises api
var jsonldPromises = jsonld.promises();

/* @ngInject */
function factory(
  $rootScope, config, brAlertService, brRefreshService, brResourceService) {
  var service = {};

  // collection of all vocabs
  service.collection = new brResourceService.Collection();

  var CONTEXT = {
    '@context': {
      id: '@id',
      type: '@type',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      br: 'urn:bedrock:',
      layout: {'@id': 'br:layout', '@container': '@list'},
      property: {'@id': 'br:property', '@type': '@id'},
      resource: {'@id': 'br:resource', '@type': '@id'},
      date: {'@id': 'br:date', '@type': 'xsd:dateTime'},
      domain: {'@id': 'rdfs:domain',  '@type': '@id'},
      range: {'@id': 'rdfs:range', '@type': '@id'},
      comment: 'rdfs:comment',
      label: 'rdfs:label',
      value: 'rdf:value',
      Property: 'rdf:Property',
      PropertyGroup: 'br:PropertyGroup'
    }
  };

  // frames properties and property groups
  var FRAME = {
    '@context': CONTEXT,
    type: ['Property', 'PropertyGroup']
  };

  service.create = function() {
    return new Library();
  };

  function Library() {
    var self = this;

    // all loaded vocabs
    self.vocabs = {};
    // all properties from all loaded vocabs
    self.properties = {};
    // all groups from all loaded vocabs
    self.groups = {};
    // flattened graph of all properties and groups
    self.graph = {'@context': CONTEXT, '@graph': []};

    // preload configured vocabs
    var vocabs = [];
    if(config.data.forms) {
      angular.forEach(config.data.forms.vocabs || [], function(id) {
        vocabs.push(self.load(id));
      });
      Promise.all([vocabs]).catch(function(err) {
        brAlertService.add('error', err);
      }).then(function() {
        $rootScope.$apply();
      });
    }
  }

  Library.prototype.load = function(id) {
    var self = this;
    return service.collection.get(id)
      .then(function(vocab) {
        // compact
        return jsonldPromises.compact(vocab, CONTEXT);
      })
      .then(function(vocab) {
        // store vocab
        self.vocabs[id] = vocab;
        // frame properties and groups w/embedded properties
        return jsonldPromises.frame(vocab, FRAME, {embed: '@always'});
      })
      .then(function(framed) {
        // merge into existing properties and reframe
        var nodes = jsonld.getValues(framed, '@graph');
        self.graph['@graph'].push.apply(self.graph['@graph'], nodes);
        return jsonldPromises.frame(self.graph, FRAME, {embed: '@always'});
      })
      .then(function(framed) {
        self.graph = framed;
        // build property and group indexes
        self.properties = {};
        self.groups = {};
        var nodes = jsonld.getValues(framed, '@graph');
        angular.forEach(nodes, function(node) {
          // raise conflict exception, overwrite silently?
          if(jsonld.hasValue(node, 'type', 'Property')) {
            self.properties[node.id] = node;
          } else if(jsonld.hasValue(node, 'type', 'PropertyGroup')) {
            self.groups[node.id] = node;
          }
        });
        return self.vocabs[id];
      });
  };

  // register for system-wide refreshes
  brRefreshService.register(service.collection);

  // expose service to scope
  $rootScope.app.services.form = service;

  return service;
}

return {brFormLibraryService: factory};

});
