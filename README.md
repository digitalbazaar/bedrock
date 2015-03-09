#bedrock

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


## Quick Examples

```
npm install bedrock
```

Create a bedrock application with an express server and mongodb-backed
session storage:

```js
var bedrock = require('bedrock');

// modules
require('bedrock-express');
require('bedrock-session-mongodb');

bedrock.events.on('bedrock-express.configure.routes', function(app) {
  app.get('/', function(req, res) {
    res.send('Hello World!');
  });
});

bedrock.start();
```

## Comphrehensive Module Example

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
var bedrock = require('bedrock');
var http = require('http');

// setup default module config
bedrock.config['example-server'] = {port: 80};

var server = http.createServer();

// emitted prior to command line parsing
bedrock.events.on('bedrock-cli.init', function() {
  // add a new subcommand executed via: node project.js analyze
  var command = bedrock.program
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
  var command = bedrock.config.cli.command;
  if(command.name() !== 'debug') {
    // `debug` not specified on the command line, return early
    return;
  }

  // emitted after all bedrock.start listeners have run
  bedrock.events.on('bedrock.ready', function() {
    // print out all the listeners that registered with the server
    var event = command.debugEvent || 'request';
    var listeners = server.listeners(event);
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
bedrock.events.on('bedrock.init', function(callback) {
  // listen on port 80
  server.listen(bedrock.config['example-server'].port, function() {
    // ready, call callback to allow bedrock to continue processing events
    callback();
  });

  // emitted for modules to do or schedule any unprivileged work on start up
  bedrock.events.on('bedrock.start', function(callback) {
    // emit a custom event giving other modules access to the example server
    bedrock.events.emit('example.server.ready', server, function() {
      callback();
    });
  });
});

// emitted after all bedrock.ready listeners have run
bedrock.events.on('bedrock.started', function() {
  console.log('everything is running now');
});
```

### Module `bedrock-example-listener.js`:

```js
var bedrock = require('bedrock');
require('./bedrock-example-listener');

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
var bedrock = require('bedrock');

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

For documentation on Bedrock's core configuration, see [config.js](https://github.com/digitalbazaar/bedrock/blob/0.3.x/lib/config.js).

## How It Works

Bedrock is a modular system built on node.js. Node.js modules typically
communicate with each other using the CommonJS API (eg: `require` and
`module.exports`, etc.), and Bedrock modules are no different. However,
Bedrock also provides some additional low-level subsystems to help modules
coordinate. These include: `bedrock.config`, `bedrock.events`,
`bedrock.jsonld`, `bedrock.loggers`, `bedrock.test`, and `bedrock.util`.

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
that are identified by the object's keys. For example Bedrock introduces
the `cli`, `core`, `constants`, `jsonld`, and `loggers` object keys. The best
practice for modules to claim their own area in the configuration object is to
insert their default configuration object using a key that either matches their
module name or that matches their module name minus any `bedrock-` prefix. For
example, the [bedrock-server][] module's specific configuration object can be
found under `bedrock.config.server`. Modules may define whatever configuration
variables they want to using whatever format is appropriate for their own
use.

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
cancel events. Whenever a synchronous listener returns `false` or an
asynchronous listener passes `false` to its callback, the event will not be
emitted to the remaining listeners, and, if a callback was given when the
event was emitted, it will be given the `false` value allowing the emitter to
take a different action. Event cancelation allows modules to build-in default
behavior that can be canceled by other modules.

To a emit an event:

```js
bedrock.events.emit('example-module.foo', data, function(err, result) {
  if(err) {
    console.log('an error occurred in a listener and the event was canceled');
    return;
  }
  if(result === false) {
    console.log('the event was canceled, but not due to an error');
    return;
  }
  console.log('the event was not canceled');
});
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
bedrock.events.on('example-module.foo', function(data, callback) {
  // because an additional parameter was added to the listener function,
  // it is assumed it should be a function and a callback will be passed
  // that *must* be called
  if(anErrorOccurred) {
    return callback(new Error('foo'));
  }
  if(iShouldCancel) {
    return callback(null, false);
  }
  // do something asynchronous, other listeners won't execute and event
  // emission won't continue until you call the callback
  process.nextTick(function() {
    callback();
  });
});
```

Note that the asynchronous analog for throwing an error is calling the callback
with an error as its first parameter and the analog for returning a value
(typically only used for event cancelation) is to pass `null` for the first
parameter and the return value for the second parameter of the callback. This
API matches the "error-first" callback continuation-style that is standard
practice in node.

Bedrock core emits several events that modules may listen for. These events
fall into two possible namespaces: `bedrock-cli` and `bedrock`. The
`bedrock-cli` events are emitted to allow coordination with Bedrock's command
line interface. The `bedrock` events are emitted after the `bedrock-cli`
events, unless a listener cancels the `bedrock-cli.ready` event or causes the
application to exit early.

- **bedrock-cli.init**
  - Emitted before command line parsing. Allows registration of new subcommands.
- **bedrock-cli.ready**
  - Emitted after command line parsing. Allows execution of subcommands or the
    prevention of `bedrock` events from being emitted, either by canceling this
    event or by exiting the application early.
- **bedrock-cli.test.configure**
  - Emitted during `bedrock-cli.init` after `test` subcommand has been
    registered. Listeners receive the `test` command object. Allows modules
    that define new test frameworks to add new `test` command line options via
    the `test` command object.
- **bedrock.test.configure**
  - Emitted during `bedrock-cli.ready`, before `bedrock.configure`. Allows
    listeners to make configuration changes for running tests.
- **bedrock.configure**
  - Emitted after `bedrock-cli.ready` and before `bedrock.init`. Allows
    additional custom configuration before Bedrock initializes but after
    command line parsing.
- **bedrock.init**
  - Emitted after `bedrock.configure` and before process privileges are
    dropped. Allows listeners to perform early initialization tasks that
    require special privileges. Note that, if Bedrock is started with elevated
    privileges (ie: as root), listeners will execute with those privileges. Any
    background work that needs to execute but does not require elevated
    privileges should be deferred to `bedrock.start`.
- **bedrock.start**
  - Emitted after `bedrock.init` and after process privileges have been
    dropped. This is the event modules should use to execute or schedule their
    main background behavior.
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

### bedrock.jsonld

Bedrock is intended to provide a foundation for [Linked Data][] applications,
and as such, it provides a [JSON-LD][] processor (via [jsonld.js][]) that is
integrated with its configuration system. Any [JSON-LD context][] that is
inserted into the `bedrock.config.constants.CONTEXTS` object (where keys
are the URL for the context and the values are the context itself), will be
served from disk instead of retrieved from the Web. This is a useful feature
for both developing [Linked Data][] applications and for ensuring contexts
are available in offline mode.

### bedrock.loggers

Bedrock has a built-in logging subsystem based on [winston][]. Anything you
can do with [winston][], you can do with Bedrock. Bedrock provides a set of
default loggers that are suitable for most applications. The main application
logger can be retrieved via `bedrock.loggers.get('app')`.

### bedrock.test

Bedrock comes with test support built-in. It provides a test framework based
on mocha that integrates with `bedrock.config`. To add a mocha test to a
Bedrock module, you simply push a directory or a file path onto the
`config.mocha.tests` array. Bedrock also makes it easy to add other test
frameworks via Bedrock modules. For example, [bedrock-protractor][] integrates
the [AngularJS][] [protractor][] test framework with Bedrock. Whenever you
run tests against your project, your project and all of its dependencies will
be tested, using whatever test frameworks they have registered with. Bedrock
also provides command line options to limit the tests that run as desired.

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

[bedrock-server][] provides a core, cluster-based HTTPS server.

[bedrock-express][] provides an Express server with reasonable
defaults and extra features like the ability to layer static
files and directories to support overrides.

[bedrock-mongodb][] provides an API for connecting to a MongoDB
database and creating and using collections.

[bedrock-jobs][] provides a background job scheduler.

[bedrock-requirejs][] provides a client-side module loader and
autoconfiguration capabilities for bower components.

[bedrock-views][] provides server-rendered views with HTML5 + Bootstrap3.

[bedrock-angular][] layers on top of [bedrock-views][] to provide
client-rendered AngularJS views.

[bedrock-idp][] provides user identity and public key management.

[bedrock-protractor][] integrates [protractor][] with Bedrock, exposing a
powerful end-to-end [AngularJS][] test framework to Bedrock modules.

Other Bedrock modules provide REST APIs, user account management, strong
cryptography support, DoS protection, digital signatures, Linked Data, and
tons of other [FEATURES][]. If you don't need all the fancy features, Bedrock
is modular, so you can use only the modules you want.

# TODO: Move old Bedrock documentation below to the appropriate module

## Quickstart

You can follow the following tutorial to setup and use Bedrock on a Linux or
Mac OS X development machine.

## Requirements

* Linux or Mac OS X (also works on Windows with some coaxing)
* node.js >= 0.10.x
* npm >= 1.4.x
* mongodb ~= 2.4.x (optional, but strongly recommended)

## Setup

1. Setup an admin user on mongodb (see below)
2. Map the `bedrock.dev` hostname to your machine (see below).
3. git clone git@github.com:digitalbazaar/bedrock.git
4. cd bedrock && npm install
5. [optional] Tweak config settings in configs/dev.js

To setup an admin user on mongodb:

1. mongo
2. use admin
3. db.addUser( { user: "admin", pwd: "password", roles: [ "clusterAdmin", "readWriteAnyDatabase", "userAdminAnyDatabase", "dbAdminAnyDatabase"] } )

To setup the `bedrock.dev` hostname:

1. Edit the /etc/hosts file as the administrator/root.
2. Add an entry mapping the IP address to `bedrock.dev`.
   For example: `192.168.0.15 bedrock.dev` (where `192.168.0.15`
   is the IP address of your primary network device.

Running Bedrock
---------------

Run the following to start up a development server from the source directory:

    node bedrock.dev.js

To add more verbose debugging, use the `--log-level` option:

    node bedrock.dev.js --log-level debug

To access the server:

1. Go to: https://bedrock.dev:22443/
2. The certificate warning is normal for development mode. Accept it and
   continue to the landing page.
3. Login as the admin `admin` with the password `password` or create a new
   account.

Running the Tests
-----------------

Install protractor (before first test run):

    npm run install-protractor

Run all backend and frontend tests:

    npm run test

Run just the backend tests:

    npm run test-backend

Run just the frontend tests:

    npm run test-frontend

Run a specific frontend test suite:

    nodejs test.js --frontend --suite unit

Running the Code Coverage Tool
------------------------------

    npm run coverage

Look at 'coverage.html' using a web browser

Minimizing the RequireJS client-side JS
---------------------------------------

    npm run minify

To test in dev mode, set the website config var 'minify' to true.

Generating a new self-signed SSL certificate for testing
--------------------------------------------------------

    nodejs create-credentials.js

Save the generated private key and certificate PEMs in the appropriate files
(in ./pki/ if using the default config).

Features
--------

For a complete list of features included in Bedrock, see the [FEATURES][] file.

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

    Copyright (c) 2011-2015 Digital Bazaar, Inc.
    All Rights Reserved

You can use Bedrock for non-commercial purposes such as self-study, research,
personal projects, or for evaluation purposes. See the [LICENSE][] file for
details about the included non-commercial license information.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[CONTRIBUTING]: CONTRIBUTING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md
[AngularJS]: https://github.com/angular/angular.js
[JSON-LD]: http://json-ld.org
[JSON-LD context]: http://www.w3.org/TR/json-ld/#the-context
[Linked Data]: http://en.wikipedia.org/wiki/Linked_data
[bedrock-angular]: https://github.com/digitalbazaar/bedrock-angular
[bedrock-express]: https://github.com/digitalbazaar/bedrock-express
[bedrock-idp]: https://github.com/digitalbazaar/bedrock-idp
[bedrock-jobs]: https://github.com/digitalbazaar/bedrock-jobs
[bedrock-mongodb]: https://github.com/digitalbazaar/bedrock-mongodb
[bedrock-protractor]: https://github.com/digitalbazaar/bedrock-protractor
[bedrock-requirejs]: https://github.com/digitalbazaar/bedrock-requirejs
[bedrock-server]: https://github.com/digitalbazaar/bedrock-server
[bedrock-views]: https://github.com/digitalbazaar/bedrock-views
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
[protractor]: https://github.com/angular/protractor
[winston]: https://github.com/winstonjs/winston
