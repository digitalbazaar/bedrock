/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var email = require('emailjs');
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var swigcore = require('swig');
var swigLoaders = require('./swig.loaders');
var BedrockError = bedrock.tools.BedrockError;
var MailParser = require('mailparser').MailParser;

// constants
var MODULE_NS = 'bedrock.mail';

var api = {};
api.name = MODULE_NS;
module.exports = api;

// email client
var client;

// template ID => filename mapping
var templates = {};

// event detail triggers
var triggers = {};

// create a local instance of swig for mail templates
var swig = new swigcore.Swig({
  autoescape: false,
  cache: bedrock.config.mail.templates.cache,
  loader: swigLoaders.multipath({
    base: bedrock.config.mail.templates.paths
  })
});

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      if(bedrock.config.mail.send) {
        // connect to smtp server
        client = email.server.connect(bedrock.config.mail.connection);
      }
      callback();
    },
    function(callback) {
      // load template mappers in order
      var mappers = bedrock.config.mail.templates.mappers;
      mappers.forEach(function(mapper) {
        require(mapper).map(templates);
      });

      // attach listeners for events from config
      var events = bedrock.config.mail.events;
      async.forEach(events, function(info, callback) {
        bedrock.logger.debug('mailer registering for event: ' + info.type);
        bedrock.events.on(info.type, function(event) {
          bedrock.logger.debug('mailer handling event: ' + event.type);

          async.waterfall([
            function(callback) {
              if(event.details && event.details.triggers) {
                return async.forEachSeries(
                  event.details.triggers, function(name, callback) {
                    if(!(name in triggers)) {
                      bedrock.logger.debug(
                        'mailer has no triggers for: ' + name);
                      return callback();
                    }
                    bedrock.logger.debug(
                      'mailer firing triggers for: ' + name);
                    async.forEachSeries(triggers[name],
                      function(trigger, callback) {
                        trigger(event, callback);
                      }, callback);
                }, callback);
              }
              callback();
            },
            function(callback) {
              // build mail vars
              var vars = bedrock.tools.extend(
                bedrock.tools.clone(bedrock.config.mail.vars),
                bedrock.tools.clone(info.vars || {}),
                bedrock.tools.clone(event.details || {}));

              // send message
              api.send(info.template, vars, callback);
            }
          ], function(err, details) {
            if(err) {
              bedrock.logger.error(
                'could not send email for event ' + info.type + ': ' +
                err.message, {error: err});
            }
            else if(details) {
              bedrock.logger.debug('sent email details', details);
            }
          });
        });
        callback();
      }, callback);
    }
  ], callback);
};

/**
 * Registers a trigger that will be fired if found in event.details.triggers.
 * The trigger may modify the details of the event.
 *
 * @param name the name of the trigger in event.details.trigger.
 * @param trigger(event, callback) the trigger function to call.
 */
api.registerTrigger = function(name, trigger) {
  if(!(name in triggers)) {
    triggers[name] = [];
  }
  triggers[name].push(trigger);
};

/**
 * Sends an email using the given template ID and variables.
 *
 * @param id the ID of the template to use for the email.
 * @param vars the variables to use to populate the email.
 * @param callback(err, details) called once the operation completes.
 */
api.send = function(id, vars, callback) {
  var entry = templates[id];
  if(!entry) {
    return callback(new BedrockError(
      'Could not send email; unknown email template ID.',
      MODULE_NS + '.UnknownEmailTemplateId', {id: id}));
  }

  // special falsey flag to stop email
  var sendFlag = MODULE_NS + '.SendEmail';
  if(sendFlag in vars && !vars[sendFlag]) {
    return callback();
  }

  // outputs JSON
  vars.toJson = function(value) {
    return JSON.stringify(value, null, 2);
  };

  try {
    // produce email
    var tpl = swig.compileFile(entry.filename);
    email = tpl(vars);
  }
  catch(ex) {
    return callback(new BedrockError(
      'Could not send email; a template parsing error occurred.',
      MODULE_NS + '.TemplateParseError', {}, ex));
  }

  // parse email into message parameter
  var mailParser = new MailParser();
  mailParser.on('error', function(err) {
    return callback(new BedrockError(
      'Could not send email; a mail parsing error occurred.',
      MODULE_NS + '.MailParseError', {}, err));
  });
  mailParser.on('end', function(parsed) {
    // create message to send
    var message = parsed.headers;
    message.text = parsed.text;

    if(!message.to || !message.from || !message.text) {
      return callback(new BedrockError(
        'Could not send email; message is missing "to", "from", or "text".',
        MODULE_NS + '.InvalidMessage', {message: message}));
    }

    // only send message if client is defined
    if(client) {
      return client.send(message, callback);
    }

    // log message instead
    var meta = {
      details: message,
      preformatted: {emailBody: '\n' + message.text}
    };
    delete message.text;
    bedrock.logger.debug('email logged instead of sent:', meta);
    callback();
  });
  mailParser.write(email);
  mailParser.end();
};
