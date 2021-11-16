<img src="https://digitalbazaar.com/wp-content/uploads/BedrockLogo.png">

[![Bedrock Node.js CI](https://github.com/digitalbazaar/bedrock/workflows/Bedrock%20Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/bedrock/actions?query=workflow%3A%22Bedrock+Node.js+CI%22)
[![Dependency Status](https://img.shields.io/david/digitalbazaar/bedrock.svg)](https://david-dm.org/digitalbazaar/bedrock)

A core foundation for rich Web applications.

## Overview

When creating a Web app, you need a foundation on which to build. There are
a lot of disparate technologies out there that can be brought together into
a cohesive whole to make this happen. The trouble is in finding, vetting,
testing, and combining these technologies -- all of which needs to happen
before you can begin to make serious progress on your own project.

Bedrock helps you launch your ideas faster by bundling all the best-of-breed
tooling that's necessary to build a modern, scalable Web app. It creates a
solid foundation on which you can build, letting you focus on your
project-specific needs.

Bedrock uses a modular design to help keep code well-organized and to allow an
ecosystem to grow without unnecessary hindrance. Bedrock keeps its core simple:
it provides a powerful configuration system, an event-based API, Linked
Data-capabilities, and testing infrastructure that makes writing interactive
modules easy. Bedrock is an opinionated, but flexible framework; it tells
developers that there's one recommended way to accomplish a task, but if need
be, a developer can go in another direction. Many of Bedrock's modules attempt
to emulate this approach, creating organizing priniciples and clear guidelines
for developers to follow that help break down problems and reduce cognitive
load.

Bedrock uses node.js and runs on Linux, Mac OS X, and Windows. It can run on a
low-powered laptop all the way up to an enterprise server.

## Runnable Examples

A very basic, runnable "Hello World" bedrock example can be found
at [bedrock-hello-world](https://github.com/digitalbazaar/bedrock-hello-world).

More complex, runnable examples can be found at [bedrock-examples](https://github.com/digitalbazaar/bedrock-examples).

## Quick Examples

```
npm install bedrock
```

Create a typical application:

```js
const bedrock = require('bedrock');

// modules
require('bedrock-express');
require('bedrock-mongodb');
require('bedrock-server');
require('bedrock-session-mongodb');
require('bedrock-validation');
require('bedrock-views');
require('bedrock-webpack');

bedrock.start();
```

To include the [Vue.js][]-based frontend, `npm install` these modules:

```
bedrock-vue
bedrock-quasar
```

Create a simple express-based bedrock application:

```js
const bedrock = require('bedrock');

// modules
require('bedrock-express');

bedrock.events.on('bedrock-express.configure.routes', function(app) {
  app.get('/', function(req, res) {
    res.send('Hello World!');
  });
});

bedrock.start();
```

Create a bedrock REST application with an express server, mongodb database,
and mongodb-backed session storage:

```js
const bedrock = require('bedrock');

// modules
require('bedrock-express');
require('bedrock-session-mongodb');
const database = require('bedrock-mongodb');

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await database.openCollections(['people']);
});

bedrock.events.on('bedrock-express.configure.routes', function(app) {
  app.get('/people', function(req, res, next) {
    database.collections.people.find({}).toArray(function(err, docs) {
      if(err) {
        return next(err);
      }
      res.send(docs);
    });
  });

  app.get('/people/:name', function(req, res, next) {
    database.collections.people.findOne(
      {name: req.param('name')}, function(err, result) {
        if(err) {
          return next(err);
        }
        res.send(result);
      });
  });

  app.post('/people/:name', function(req, res){
    database.collections.people.insert(
      [{name: req.param('name')}], function(err, result) {
        if(err) {
          return next(err);
        }
        res.send(result.result);
      });
  });

  app.delete('/people/:name', function(req, res){
    database.collections.people.remove(
      {name: req.param('name')}, function(err, result) {
        if(err) {
          return next(err);
        }
        res.send(result.result);
      });
  });
});

bedrock.start();
```

To create a MEAN stack application with identity management and authentication,
see the [bedrock-seed][] project.

## Comprehensive Module Example

Below is an example that demonstrates Bedrock's event API. It creates a
module with an http server that other modules can attach listeners to. It
also registers a `debug` subcommand that displays the listeners that attached
to the http server. The example also creates a module that attaches a simple
"hello world" listener to the http server. The example demonstrates how to use
Bedrock's event API to:

1. Register a subcommand and handle it if is detected when the command line
   is parsed.
2. Create a modular http server, listen to a privileged port (80), and emit a
   custom event to allow other modules to attach listeners to the server only
   after process privileges have been dropped.
3. Execute custom behavior (eg: print the server's registered event listeners)
   after all other modules have started, if a subcommand was detected.

### Module `bedrock-example-server.js`:

```js
const bedrock = require('bedrock');
const http = require('http');

// setup default module config
bedrock.config['example-server'] = {port: 80};

const server = http.createServer();

// emitted prior to command line parsing
bedrock.events.on('bedrock-cli.init', function() {
  // add a new subcommand executed via: node project.js debug
  const command = bedrock.program
    .command('debug')
    .description('display registered http listeners')
    .option(
      '--debug-event <event>',
      'The event to print listeners for. [request]')
    .action(function() {
      // save the parsed command information
      bedrock.config.cli.command = command;
    });
});

// emitted after the command line has been parsed
bedrock.events.on('bedrock-cli.ready', function() {
  const command = bedrock.config.cli.command;
  if(command.name() !== 'debug') {
    // `debug` not specified on the command line, return early
    return;
  }

  // emitted after all bedrock.start listeners have run
  bedrock.events.on('bedrock.ready', function() {
    // print out all the listeners that registered with the server
    const event = command.debugEvent || 'request';
    const listeners = server.listeners(event);
    console.log('listeners for event: ' + event);
    listeners.forEach(function(listener, index) {
      console.log(index, listener.toString());
    });
  });
});

// emitted before initialization, to allow any further configuration
bedrock.events.on('bedrock.configure', function() {
  if(bedrock.config.foo) {
    bedrock.config.foo.bar = true;
  }
});

// emitted for early initialization, prior to dropping process privileges
bedrock.events.on('bedrock.admin.init', async () => {
  // listen on port 80
  return new Promise((resolve, reject) => {
    // resolve when listening to allow bedrock to continue processing events
    server.listen(bedrock.config['example-server'].port, () => resolve());
  });
});

// emitted for modules to do or schedule any unprivileged work on start up
bedrock.events.on('bedrock.start', async () {
  // emit a custom event giving other modules access to the example server
  await bedrock.events.emit('example.server.ready', server);
});

// emitted after all bedrock.ready listeners have run
bedrock.events.on('bedrock.started', function() {
  console.log('everything is running now');
});
```

### Module `bedrock-example-listener.js`:

```js
const bedrock = require('bedrock');

// load bedrock-example-server dependency
require('./bedrock-example-server');

// emitted to allow listeners to be attached to the example server
bedrock.events.on('example.server.ready', function(server) {
  server.on('request', function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World\n');
  });
});
```

### Example Main Project `project.js`:

```js
const bedrock = require('bedrock');

// bedrock modules to load
require('./bedrock-example-server');
require('./bedrock-example-listener');

// change the port to use
// bedrock.config['example-server'].port = 8123;

bedrock.start();
```

Run the main project and display the debug information with:

```
node project.js debug --debug-event request
```

Example output:

```
2015-03-05T21:59:23.727Z - info: starting bedrock...
2015-03-05T21:59:23.729Z - info: running bedrock master process pid=7705
2015-03-05T21:59:23.904Z - info: running bedrock worker process workerPid=7711
2015-03-05T21:59:23.906Z - info: startup time: 6ms workerPid=7711
listeners for event: request
0 'function (request, response) {\n    response.writeHead(200, {\'Content-Type\': \'text/plain\'});\n    response.end(\'Hello World\\n\');\n  }'
everything is running now
```

## Configuration

For documentation on Bedrock's core configuration, see [config.js](./lib/config.js).

## How It Works

Bedrock is a modular system built on node.js. Node.js modules typically
communicate with each other using the CommonJS API (eg: `require` and
`module.exports`, etc.), and Bedrock modules are no different. However,
Bedrock also provides some additional low-level subsystems to help modules
coordinate. These include: `bedrock.config`, `bedrock.events`,
`bedrock.loggers`, and `bedrock.util`.

To create a Bedrock project, all you need to do is create a JavaScript file,
for example `project.js`, that requires `bedrock`, any other Bedrock modules
you're interested in, and that then calls `bedrock.start()`. To run your
project, run:

```
node project.js
```

If you're developing your project and you have installed all of the development
packages for the Bedrock modules you're using, you can also easily test your
project and any of the modules it has included by running:

```
node project.js test
```

This will execute Bedrock's built-in test framework, running all of the tests
that each module has written. This approach ensures you're running tests for
your entire project and its dependencies.

### bedrock.config

Bedrock has a simple, but highly-customizable configuration system. All
configuration variables are stored in a shared JavaScript object
`bedrock.config`. The object is partitioned into separate configuration objects
that are identified by the object's keys. For example Bedrock introduces the
`cli`, `core`, `constants`, and `loggers` object keys. The best
practice for modules to claim their own area in the configuration object is to
insert their default configuration object using a key that either matches their
module name or that matches their module name minus any `bedrock-` prefix. For
example, the [bedrock-server][] module's specific configuration object can be
found under `bedrock.config.server`. A `mycompany-feature` module would be
found under `bedrock.config['mycompany-feature']`. Modules may define whatever
configuration variables they want to using whatever format is appropriate for
their own use.

The `bedrock.util` module has helpers to setup configurations, and in
particular, dynamically computed configurations. Computed values can help to
simplify dependency issues by allowing values to be computed at runtime from a
function or string template. (Note there is a small cost with computed config
values which could be important depending on the use case.)

`bedrock.util.config.Config` creates a wrapper around a config object and
optional options. This wrapper exposes a new, helpful API that is detailed
below. A common setup could look like the following.

```js
// an empty config object
let config = {};
// common options
let options = {
  // the config
  config: config
  // local vars used during string template evaluation
  locals: config
};
// wrap the config
let c = new bedrock.util.config.Config(config, options);
```

Bedrock provides a shared wrapper around the common `bedrock.config` as
`bedrock.util.config.main`.

To do simple sets of config data, use the `set()` API.

```js
let c = bedrock.util.config.main;
// set a config variable with a path
// path components are created as needed
c.set('server.port', 8443);
// config is now {"server": {"port": 8443}}
```

Normal code and the config API can be mixed. A useful helper is `setDefault()`.
This call lets you simplify ensuring a full object path exists before setting
data. Objects in the path are created as needed.

```js
let config = bedrock.config;
let c = bedrock.util.config.main;
// create container object if needed
c.setDefault('accounts.admin', {});
// the config is just a normal object
config.accounts.admin.name = 'Ima Admin';
c.set('accounts.admin.id', 1);
// the config object is returned from setDefault()
let account123 = c.setDefault('accounts.account123', {});
account123.id = 123;
account123.name = 'Account 123';
```

Computed config values using the `setComputed()` API add on a much more
powerful feature where values will be calculated at runtime.

```js
let config = bedrock.config;
// get the Config wrapper for the default bedrock.config
let c = bedrock.util.config.main;
// set static values
c.set('server.port', 8443);
c.set('server.domain', 'bedrock.dev');
// set a computed value that uses values from the main config
c.setComputed('server.host', () => {
  return config.server.domain + ':' + config.server.port;
});
console.log(config.server.host); // "bedrock.dev:8443"
```

The logic for a computed value can be any normal code. If source config values
are updated the computed values will reflect the change.

```js
let config = bedrock.config;
let c = bedrock.util.config.main;
c.set('server.port', 8443);
c.set('server.domain', 'bedrock.dev');
c.setComputed('server.host', () => {
  // only add the port if it's not the well known default
  if(config.server.port !== 443) {
    return config.server.domain + ':' + config.server.port;
  }
  return config.server.domain;
});
console.log(config.server.host); // "bedrock.dev:8443"
c.set('server.port', 443);
console.log(config.server.host); // "bedrock.dev"
```

`setComputed()` can be verbose. a wrapper can be created using the standard
`bind()` functionality. A helper called `computer()` will do this for you.
```js
let config = bedrock.config;
let cc = bedrock.util.config.main.computer();
cc('server.host', () => {
  // only add the port if it's not the well known default
  if(config.server.port !== 443) {
    return config.server.domain + ':' + config.server.port;
  }
  return config.server.domain;
});
```

Computed values can also be created with [lodash-style string
templates](https://lodash.com/docs/#template).

```js
let config = bedrock.config;
let cc = bedrock.util.config.main.computer();
cc('server.baseUri', 'https://${server.host}');
console.log(config.server.baseUri); // "https://bedrock.dev:8443"
// use locals option to simplify templates
cc('base.computed', '${base.a}:${base.b}:${base.c}');
cc('base.computed', '${a}:${b}:${c}', {locals: config.base});
```

Setting or computing multiple values with one call uses an object notation:

```js
let c = bedrock.util.config.main;
let cc = c.computer();
c.set({
  'server.port': 8443,
  'server.domain': 'bedrock.dev',
  'server.name': 'Bedrock Dev',
  'users.admin.id': 1
});
cc({
  'server.url': 'https://${server.domain}:${server.port}',
  'users.admin.url': '${server.url}/users/${users.admin.id}'
});
```

Computed values can be added to an array using indexing or the `pushComputed`
feature. If indexing is used the array must already exist or the
`{parentDefault: []}` option should be used. `pushComputed` will create the
parent array if needed.

```js
let config = bedrock.config;
let c = bedrock.util.config.main;
let cc = c.computer();
cc('server.baseUri', 'https://${server.host}');
c.setDefault('resources', []);
cc('resources[0]', '${server.baseUri}/r/0');
c.pushComputed('resources', '${server.baseUri}/r/1');
```

### bedrock.events

It's sometimes necessary to allow modules to coordinate with each other in
an orderly fashion. To achieve this, Bedrock provides an event API. Bedrock's
event API is very similar to node's built-in EventEmitter, but it provides a
few additional features.

In particular, when emitting an event, Bedrock can wait for a listener to run
asynchronous code before executing the next listener. This allows each listener
to run synchronously or asynchronously, depending on their individual needs,
without worrying that the next listener or the next event will be emitted
before they have completed what they need to do.

Bedrock's event system also provides another feature, which is the ability to
cancel events. Event cancelation allows modules to build-in default behavior
that can be canceled by other modules. Whenever a synchronous listener returns
`false` or an asynchronous listener resolves to `false`, the event will not be
emitted to the remaining listeners, and the emit call will resolve to `false`
allowing the emitter to take a different action.

To a emit an event:

```js
try {
  const result = await bedrock.events.emit('example-module.foo', data);
  if(result === false) {
    console.log('the event was canceled, but not due to an error');
  }
} catch(err) {
  console.log('an error occurred in a listener and the event was canceled');
}
console.log('the event was not canceled');
```

To create a synchronous listener:

```js
bedrock.events.on('example-module.foo', function(data) {
  if(anErrorOccured) {
    throw new Error('foo');
  }
  if(shouldCancel) {
    return false;
  }
  // do something synchronous
});
```

To create an asynchronous listener:

```js
bedrock.events.on('example-module.promise', data => {
  return new Promise((resolve, reject) => {
    if(anErrorOccurred) {
      reject(throw new Error('foo'));
      return;
    }
    if(shouldCancel) {
      resolve(false);
      return;
    }
    // do something asynchronous, other listeners won't execute and event
    // emission won't continue until you resolve the promise
    process.nextTick(() => {
      resolve();
    });
  });
});
bedrock.events.on('example-module.async-await', async data => {
  if(anErrorOccurred) {
    throw new Error('foo');
  }
  if(shouldCancel) {
    return false;
  }
  // do something asynchronous, other listeners won't execute and event
  // emission won't continue until you return
  await myFunction();
});
```

Note that the asynchronous Promise analog for throwing an error is rejecting
the Promise with an error and the analog for returning a value (typically only
used for event cancelation) is to resolve the Promise with the value.

Bedrock core emits several events that modules may listen for. These events
fall into three possible namespaces: `bedrock-cli`, `bedrock-loggers` and
`bedrock`. The `bedrock-cli` events are emitted to allow coordination with
Bedrock's command line interface. The `bedrock-loggers.init` event is emitted
after the `bedrock-cli.init` event. The `bedrock` events are emitted after
all the `bedrock-cli` events, unless a listener cancels the `bedrock-cli.ready`
event or causes the application to exit early.

- **bedrock-cli.init**
  - Emitted before command line parsing. Allows registration of new subcommands.
- **bedrock-cli.parsed**
  - Emitted after command line parsing. Allows for configuration of loggers
    based on command line flags. For instance, a logger may provide for the
    specification of a `logGroupName` that may be computed at runtime based
    on some command line flag(s).
- **bedrock-loggers.init**
  - Emitted after command line parsing. Allows registration of new logging
    transports prior to initialization of the logging subsystem.
- **bedrock-cli.ready**
  - Emitted after command line parsing and logging initialization. Allows
    execution of subcommands or the prevention of `bedrock` events from being
    emitted, either by canceling this event or by exiting the application early.
- **bedrock.configure**
  - Emitted after `bedrock-cli.ready` and before `bedrock.admin.init`. Allows
    additional custom configuration before Bedrock initializes but after
    command line parsing.
- **bedrock.admin.init**
  - Emitted after `bedrock.configure` and before elevated process privileges
    are dropped. Allows listeners to perform early initialization tasks that
    require special privileges. Note that, if Bedrock is started with elevated
    privileges (ie: as root), listeners will execute with those privileges. Any
    early initialization that needs to execute before `bedrock.start` but does
    not require elevated privileges should be deferred to `bedrock.init`. Most
    modules should find binding to `bedrock.init` to be sufficient for any
    initialization work.
- **bedrock.init**
  - Emitted after `bedrock.admin.init` and just after elevated process
    privileges are dropped. Allows listeners to perform early initialization
    tasks that do not require special privileges. This event should be used
    to ensure, for example, that a module's API has the required supporting
    data structures in memory prior to another module's use of it. For example,
    a validation module may need to load validation schemas from files on disk
    before they can be accessed via its API, but this loading must occur after
    the configuration events have passed and after special process privileges
    have been dropped. **As a best practice, modules should not emit custom
    events during `bedrock.init` because it may cause scenarios where two
    unrelated modules can't be easily combined.** For example, if a module emits
    a custom event during `bedrock.init`, then a listener of that event would
    be unable to use the API of an unrelated module that hasn't been
    initialized yet. Deferring custom event emitting to `bedrock.start` solves
    this problem; it ensures all modules have had a chance to complete
    initialization before attempting to interact with one another through the
    event system.
- **bedrock.start**
  - Emitted after `bedrock.init`. This is the event modules should use to
    execute or schedule their main background behavior and to emit any custom
    events they would like to make available to their dependents.
- **bedrock.ready**
  - Emitted after `bedrock.start`. Allows listeners to execute custom behavior
    after all modules have handled the `bedrock.start` event. This event is
    useful for turning on external access to web services or other modular
    systems that should now be fully ready for use. It can also be used to run
    analysis on modules that have started, for example, to build live
    documentation.
- **bedrock.started**
  - Emitted after `bedrock.ready`. External access to web services or other
    features provided by modules should now be available. Allows custom
    subcommands or behavior to run after Bedrock has fully started, eg: tests.
- **bedrock.tests.run**
  - Emitted during `bedrock.started`. Once Bedrock has fully started, this
    event is emitted to inform test frameworks to run their tests. Listeners
    are passed a test state object with a `pass` property that they can set to
    `false` to indicate to the test subsystem that at least one test did not
    pass. Test frameworks may add their own information to the state object
    using a property matching their framework name.

### bedrock.loggers

Bedrock has a built-in logging subsystem based on [winston][]. Anything you
can do with [winston][], you can do with Bedrock. Bedrock provides a set of
default loggers that are suitable for most applications. The main application
logger can be retrieved via `bedrock.loggers.get('app')`. A call to
`bedrock.loggers.addTransport` can be made in event handlers of the
`bedrock-loggers.init` event to add new [winston][] transports. Logging
categories (such as `app`) and the transports used by them can be configured
via `bedrock.config`.

Bedrock supports multi-level child loggers with common metadata. These are
created with `bedrock.loggers.get('app').child({...})`. Provided metadata will
be added to child log output. A special `module` meta name can optionally be
used for pretty output. A shortcut for creating named module loggers is
`bedrock.loggers.get('app').child('name')`.

Module prefix display can be controlled per-category:

```js
// get a child logger with custom module name
let logger = bedrock.loggers.get('app').child('my-module');

// message module prefix controlled with a per-category config value
bedrock.config.loggers.app.bedrock.modulePrefix = false;
logger.info('an info message');
// module displayed as normal meta data:
// 2017-06-30T12:34:56.789Z - info: an info message workerPid=1234, module=my-module

// with module prefix enabled:
bedrock.config.loggers.app.bedrock.modulePrefix = true;
logger.info('an info message');
// displayed as an nice message prefix:
// 2017-06-30T12:34:56.789Z - info: [my-module] an info message workerPid=1234
```

### bedrock.util

Bedrock provides a number of helpful general purpose utilities. For example,
Bedrock defines a `BedrockError` class that extends the default `Error`
class. A `BedrockError` can keep track of a series of "causes" (other errors)
that allow developers to better understand why an error occured.
`BedrockError`s can also be marked as `public`, which allows modules that
may, for example, serve error information over the Web to display more error
details. `bedrock.util` also contains tools for formatting dates,
extending/merging/cloning objects, and generating UUIDs.

## Recommended Modules

<!-- TODO: Change section to "If you want to do X, use these modules" format -->

[bedrock-server][] provides a core, cluster-based HTTPS server.

[bedrock-express][] provides an Express server with reasonable
defaults and extra features like the ability to layer static
files and directories to support overrides.

[bedrock-mongodb][] provides an API for connecting to a MongoDB
database and creating and using collections.

[bedrock-webpack][] provides webpack configuration and build tools for
frontend bundling.

[bedrock-views][] provides infrastructure for serving single page
applications.

[bedrock-vue][] layers on top of [bedrock-views][] to provide
client-rendered Vue.js views.

[bedrock-quasar][] layers on top of [bedrock-vue][] to provide
client-rendered Quasar components.

[bedrock-account][] provides user account management.

Other Bedrock modules provide REST APIs, user account management, strong
cryptography support, DoS protection, digital signatures, Linked Data, and
tons of other [FEATURES][]. If you don't need all the fancy features, Bedrock
is modular, so you can use only the modules you want.

## Quickstart

You can follow the following tutorial to setup and use Bedrock on a Linux or
Mac OS X development machine.

## Requirements

* Linux, Mac OS X, Windows
* node.js >= 0.10.x
* npm >= 1.4.x

Running Bedrock
---------------

Run the following to start up a development server from the source directory:

    node index.js

To add more verbose debugging, use the `--log-level` option:

    node index.js --log-level debug

Running the Tests
-----------------

Run all tests:

    npm test

Run only the mocha test framework:

    node index.js test --framework mocha

Run a specific mocha test:

    node index.js test --framework mocha --mocha-test tests/test.js

Running the Code Coverage Tool
------------------------------

    npm run coverage

Look at 'coverage.html' using a web browser

Features
--------

For an example list of features provided by Bedrock modules, see the
[FEATURES][] file.

FAQ
---

See the [FAQ][] file for answers to frequently asked questions.

Hacking
-------

See the [CONTRIBUTING][] file for various details for coders about
hacking on this project.

Authors
-------

See the [AUTHORS][] file for author contact information.

License
-------

Bedrock and all Bedrock modules are:

    Copyright (c) 2011-2021 Digital Bazaar, Inc.
    All Rights Reserved

You can use Bedrock for non-commercial purposes such as self-study, research,
personal projects, or for evaluation purposes. See the [LICENSE][] file for
details about the included non-commercial license information.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[CONTRIBUTING]: CONTRIBUTING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md
[Vue.js]: https://vuejs.org/
[JSON-LD]: http://json-ld.org
[JSON-LD context]: http://www.w3.org/TR/json-ld/#the-context
[Linked Data]: http://en.wikipedia.org/wiki/Linked_data
[bedrock-account]: https://github.com/digitalbazaar/bedrock-account
[bedrock-express]: https://github.com/digitalbazaar/bedrock-express
[bedrock-jobs]: https://github.com/digitalbazaar/bedrock-jobs
[bedrock-mongodb]: https://github.com/digitalbazaar/bedrock-mongodb
[bedrock-quasar]: https://github.com/digitalbazaar/bedrock-quasar
[bedrock-server]: https://github.com/digitalbazaar/bedrock-server
[bedrock-views]: https://github.com/digitalbazaar/bedrock-views
[bedrock-vue]: https://github.com/digitalbazaar/bedrock-vue
[winston]: https://github.com/winstonjs/winston
