/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import jsonStringify from 'fast-safe-stringify';
import {MESSAGE} from 'triple-beam';
import winston from 'winston';

const {format} = winston;

export const bedrock = format(info => {
  const {timestamp, workerId, workerPid} = info;
  const stringifiedRest = jsonStringify({
    ...info,
    level: undefined,
    message: undefined,
    module: undefined,
    splat: undefined,
    timestamp: undefined,
    workerId: undefined,
    workerPid: undefined,
  }, null, 2);
  const workerInfo = `workerPid=${workerPid}, workerId=${workerId}`;
  if(stringifiedRest !== '{}') {
    info[MESSAGE] = `${timestamp} - ${info.level}: ${info.message} ` +
      `${workerInfo}, details=${stringifiedRest}`;
  } else {
    info[MESSAGE] = `${timestamp} - ${info.level}: ${info.message} ` +
     `${workerInfo}`;
  }

  return info;
});

// this filter is only operative when one of the only/exclude sets is active
export const filterModules = format((
  info, {excludeModulesSet, onlyModulesSet}) => {
  const {module} = info;

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

export const modulePrefix = format(info => {
  const {module} = info;
  if(module) {
    info.message = `[${module}] ${info.message}`;
  }
  return info;
});

export function fromConfig(config) {
  const {colorize, excludeModules, formatter, onlyModules} = config;
  let fmt;
  if(typeof formatter === 'string') {
    if(formatter === 'default') {
      const fmts = [];
      if(excludeModules || onlyModules) {
        const excludeModulesSet = excludeModules ?
          new Set(excludeModules) : false;
        const onlyModulesSet = onlyModules ? new Set(onlyModules) : false;
        fmts.push(filterModules({excludeModulesSet, onlyModulesSet}));
      }
      fmts.push(
        format.timestamp(),
        modulePrefix(),
      );
      if(colorize) {
        fmts.push(format.colorize());
      }
      fmts.push(bedrock());
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
}
