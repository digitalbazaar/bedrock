/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var fs = require('fs');
var path = require('path');
var bedrock = {
  config: require('../config')
};

var api = {};
module.exports = api;

// the multipath swig template resolver looks in multiple directories for files
/**
 * Generates a multipath resolver function. The function returns a resolver
 * that can be used by swig's loader to find template files. It tries to
 * resolve relative paths using the given base; the base may be an array of
 * bases that will be searched for an existing file in reverse order.
 *
 * @param options the options to use.
 *          [base] the base path to use; can be an array of paths.
 *          [encoding] the encoding to use when reading the file.
 *
 * @return A resolver object that can be used by swig's 'loader' option.
 */
api.multipath = function(options) {
  options = options || {};
  var base = options.base || '';
  var encoding = options.encoding || 'utf8';
  if(!Array.isArray(base)) {
    base = [base];
  }
  base = base.slice().reverse();

  var resolver = {};

  /**
   * Resolves a given relative path to a swig template file by either return
   * the pathname, or throwing an exception.
   *
   * @param to the relative pathname to the swig template file.
   * @param from the file path for the swig template 'to' is from.
   *
   * @return the resolved path to the swig template file.
   */
  resolver.resolve = function(to, from) {
    // return absolute path
    if(to === path.resolve(to)) {
      return to;
    }

    if(to) {
      var parent = '';
      if(from) {
        // get the relative path to the parent
        from = path.dirname(from);
        for(var i = 0; i < base.length; ++i) {
          var rel = path.relative(base[i], from);
          if(rel.indexOf('../') !== 0) {
            parent = rel;
            break;
          }
        }
      }

      for(var i = 0; i < base.length; ++i) {
        // resolve 'to' path against base and parent
        var filename = path.resolve(base[i], parent, to);
        if(fs.existsSync(filename)) {
          return filename;
        }
      }
    }

    // throw an exception if the swig template file can't be found
    throw new Error('Unable to find ' + to + ' in view path: ' +
      JSON.stringify(base));
  };

  /**
   * Loads a swig template given either a complete pathname or a relative one.
   *
   * @param identifier a relative pathname to a swig template file.
   * @param callback(err, data) called once the file has been read. If omitted,
   *          the contents of the file is returned.
   *
   * @return the contents of the file if callback is omitted.
   */
  resolver.load = function(identifier, callback) {
    if(callback) {
      fs.readFile(identifier, encoding, callback);
      return;
    }
    return fs.readFileSync(identifier, encoding);
  };

  return resolver;
};
