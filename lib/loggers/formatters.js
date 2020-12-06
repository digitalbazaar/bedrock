/*!
 * Copyright (c) 2012-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const jsonStringify = require('fast-safe-stringify');
const {MESSAGE} = require('triple-beam');
const winston = require('winston');

const {format} = winston;

const api = {};
module.exports = api;

api.bedrock = format(info => {
  const {timestamp, workerId, workerPid} = info;
  const stringifiedRest = jsonStringify(Object.assign({}, info, {
    level: undefined,
    message: undefined,
    module: undefined,
    splat: undefined,
    timestamp: undefined,
    workerId: undefined,
    workerPid: undefined,
  }), null, 2);
  if(stringifiedRest !== '{}') {
    info[MESSAGE] = `${timestamp} - ${info.level}: ` +
      `${info.message} details=${stringifiedRest}`;
  } else {
    info[MESSAGE] = `${timestamp} - ${info.level}: ${info.message} ` +
      `workerPid=${workerPid}, workerId=${workerId}`;
  }

  return info;
});

api.filterModules = format((info, {excludeModulesSet, onlyModulesSet}) => {
  const {module} = info;

  // FIXME: REMOVE, FOR DEBUGGING
  // node --preserve-symlinks test test --log-level debug --log-exclude foo
  if(!module) {
    console.log('MISSING_MODULE', info);
    return false;
  }

  if(!(onlyModulesSet || excludeModulesSet)) {
    return info;
  }

  // do not log unidentified modules
  if(!module) {
    return false;
  }

  // only output messages from modules specified by --log-only
  if(onlyModulesSet && !onlyModulesSet.has(module)) {
    return false;
  }
  // do not output messages from modules specified by --log-exclude
  if(excludeModulesSet && excludeModulesSet.has(module)) {
    return false;
  }

  return info;
});

api.fromConfig = config => {
  const {colorize, excludeModules, formatter, onlyModules} = config;
  let fmt;
  if(typeof formatter === 'string') {
    if(formatter === 'default') {
      const fmts = [];
      if(excludeModules || onlyModules) {
        const excludeModulesSet = excludeModules ?
          new Set(excludeModules) : false;
        const onlyModulesSet = onlyModules ? new Set(onlyModules) : false;
        fmts.push(api.filterModules({excludeModulesSet, onlyModulesSet}));
      }
      fmts.push(
        format.timestamp(),
        api.modulePrefix(),
      );
      if(colorize) {
        fmts.push(format.colorize());
      }
      fmts.push(api.bedrock());
      fmt = format.combine(...fmts);
    } else if(formatter === 'json') {
      fmt = format.combine(
        format.timestamp(),
        format.json(),
      );
    } else if(formatter === 'logstash') {
      fmt = format.combine(
        format.timestamp(),
        format.logstash(),
      );
    }
  } else {
    fmt = formatter;
  }

  return fmt;
};

api.modulePrefix = format(info => {
  const {module} = info;
  if(module) {
    info.message = `[${module}] ${info.message}`;
  }

  return info;
});
