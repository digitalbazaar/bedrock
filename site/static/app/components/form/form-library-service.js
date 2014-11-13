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

  // loaded resources indexed by id
  service.libraries = {};
  // all properties from the libraries indexed by id
  service.properties = {};
  // all property groups from the libraries indexed by id
  service.groups = {};

  // FIXME: this only works if resources have ids, need different storage?
  service.collection = new brResourceService.Collection();

  var CONTEXT = {
    '@context': {
      id: '@id',
      type: '@type',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      br: 'urn:bedrock:',
      // FIXME: don't use plural, use a better name, confused w/property term
      'properties': {'@id': 'br:properties', '@container': '@list'},
      'property': {'@id': 'br:property', '@type': '@vocab'},
      'resource': {'@id': 'br:resource', '@type': '@id'},
      'date': {'@id': 'br:date', '@type': 'xsd:dateTime'},
      'domain': {'@id': 'rdfs:domain',  '@type': '@id'},
      'range': {'@id': 'rdfs:range', '@type': '@id'},
      comment: 'rdfs:comment',
      label: 'rdfs:label',
      value: 'rdf:value',
      Property: 'rdf:Property',
      PropertyGroup: 'br:PropertyGroup'
    }
  };

  service.load = function(id) {
    if(id in service.libraries) {
      return Promise.resolve(service.libraries[id]);
    }
    return service.collection.get(id)
      .then(function(data) {
        // normalize data format
        // TODO: add framing step
        return jsonldPromises.compact(data, CONTEXT);
      })
      .then(function(data) {
        // store data
        // FIXME: use json-ld features vs raw json parsing
        var objs = jsonld.getValues(data, '@graph');
        angular.forEach(objs, function(obj) {
          if(jsonld.hasValue(obj, 'type', 'Property')) {
            // TODO: check for dups
            service.properties[obj.id] = {
              // FIXME: change to a prov source property?
              source: id,
              value: obj,
              enabled: false
            };
          } else if(jsonld.hasValue(obj, 'type', 'PropertyGroup')) {
            // TODO: check for dups
            // store source location and value
            service.groups[obj.id] = {
              // FIXME: change to a prov source property?
              source: id,
              value: obj,
              enabled: false
            };
          }
        });
        return data;
      })
      .then(function(data) {
        service.libraries[id] = data;
        return data;
      });
  };

  service.unload = function(id) {
    console.log('TODO: Implement unload', id);
  };

  // preload configured libraries
  var libs = [];
  angular.forEach(config.data.formLibraries || [], function(id) {
    libs.push(service.load(id));
  });
  Promise.all([libs]).catch(function(err) {
    brAlertService.add('error', err);
  });

  // register for system-wide refreshes
  brRefreshService.register(service.collection);

  // expose service to scope
  $rootScope.app.services.form = service;

  return service;
}

return {brFormLibraryService: factory};

});
