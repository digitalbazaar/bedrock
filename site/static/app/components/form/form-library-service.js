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
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      schema: "http://schema.org/",
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      br: 'urn:bedrock:',
      layout: {'@id': 'br:layout', '@type': '@id', '@container': '@list'},
      property: {'@id': 'br:property', '@type': '@id'},
      propertyGroup: {'@id': 'br:propertyGroup', '@type': '@id'},
      resource: {'@id': 'br:resource', '@type': '@id'},
      date: {'@id': 'br:date', '@type': 'xsd:dateTime'},
      domain: {'@id': 'rdfs:domain',  '@type': '@id'},
      range: {'@id': 'rdfs:range', '@type': '@vocab'},
      rangeOption: {
        '@id': 'br:rangeOption',
        '@type': '@id',
        '@container': '@set'
      },
      comment: 'rdfs:comment',
      label: 'rdfs:label',
      value: 'rdf:value',
      Property: 'rdf:Property',
      PropertyGroup: 'br:PropertyGroup',
      URL: "rdfs:Resource",
      String: "rdfs:Literal",
      Date: "xsd:dateTime"
    }
  };

  // frames properties and property groups
  var FRAME = {
    '@context': CONTEXT['@context'],
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
    self.graph = {'@context': CONTEXT['@context'], '@graph': []};

    // preload configured vocabs
    if(config.data.forms) {
      // TODO: fix library merging to allow for parallelizing library
      // loading
      var promise = Promise.resolve();
      angular.forEach(config.data.forms.vocabs || [], function(id) {
        promise = promise.then(function() {
          return self.load(id);
        });
      });
      promise.catch(function(err) {
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
        return jsonld.promises.compact(vocab, CONTEXT, {base: id});
      })
      .then(function(vocab) {
        // store vocab
        self.vocabs[id] = vocab;

        // merge in new vocab w/o merging existing nodes
        return jsonld.promises.merge(
          [self.graph, vocab], null, {mergeNodes: false});
      })
      .then(function(merged) {
        self.graph = merged;
        // reframe merged data w/properties and groups filtered and linked
        return jsonld.promises.frame(merged, FRAME, {embed: '@link'});
      })
      .then(function(framed) {
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
