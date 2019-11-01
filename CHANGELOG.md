# bedrock ChangeLog

### Changed
- **BREAKING**: Update Node.js requirement to v10.12.0.
- **BREAKING**: `bedrock.start()` now returns a promise instead of using a
  callback. Top-level code using the callback should change to `async`/`await`
  or `then`/`catch` as needed.
- **BREAKING**: Update `async-node-events` dependency and update events API.
  - `emit` is now an async function and used instead of passing a callback for
    completion. User code **must** be updated for this change. It is suggested
    to await the `emit` calls and use async listeners or Promises.
- **BREAKING**: `runOnce` callback form is removed and replaced with the
  `runOnceAsync` implementation. `runOnceAsync` remains as an alias for
  `runOnce` but is deprecated. Quick fix is to wrap the new `runOnce` with
  `callbackify` and the `fn` param with `promisify`.
- Use master/worker child loggers.

### Removed
- `bedrock.events.emit` wrapper. Using default from `async-node-events`.
- **BREAKING**: Deprecated event object style.

## 2.0.0 - 2019-10-22

### Changed
- **BREAKING**: Remove mocha unit test framework. The test framework now resides
  entirely in the bedrock-test module@4.
- **BREAKING**: Remove `bedrock.jsonld` and related configuration. A jsonld
  document loader is now available in bedrock-jsonld-document-loader@1.

### Added
- `bedrock.util.hasValue` helper API to replace `jsonld.hasValue`.

## 1.18.1 - 2019-07-24

### Fixed
- Fix memory leak and improve error handling in `runOnce` and `runOnceAsync`.

## 1.18.0 - 2019-07-16

### Changed
- Update lodash to 4.17.14.
- Switch to eslint.
- **BREAKING**: Update Node.js engine requirement to >= 8. Note this is due to
  the use of async/await when runOnceAsync was added in 1.16.0.

## 1.17.0 - 2019-05-06

### Changed
- Improve callback function detection in `events.emit` API.

## 1.16.0 - 2019-04-30

### Added
- `bedrock.runOnceAsync` API which is a promise based version of
  `bedrock.runOnce`.

## 1.15.0 - 2019-03-18

### Added
- `bedrock.util.delay` API which is used to create a promise which resolves
  after the specified milliseconds.

### Changed
- Use `uuid-random` for `bedrock.util.uuid`.  

## 1.14.0 - 2018-11-29

### Changed
- Change default value of `bedrock.config.jsonld.strictSSL` from `false` to
  `true`. This means that the `jsonld` library's document loader will refuse
  to retrieve documents from sites without proper SSL certificates. This change
  will impact unit tests in Bedrock modules. The `strictSSL` flag will need to
  be set to `false` in the `test.config.js` files for affected modules.

## 1.13.0 - 2018-09-20

### Added
- Add `bedrock-cli.parsed` event.

### Changed
- Update copyright notices.
- Style fixes.

## 1.12.1 - 2018-05-10

### Changed
- Update async-node-events to 1.0.0.

## 1.12.0 - 2018-05-08

### Added
- Return Promise from `events.emit` and `events.emitLater` that
  resolves to `undefined` once the event has been emitted to all
  listeners or to `false` if it was canceled.

## 1.11.0 - 2018-05-08

### Added
- Add `util.callbackify` helper to produce functions that can be
  called with a callback function or that will return a Promise
  if the callback function is omitted. This utility function
  is used in bedrock modules that are written using Promises
  internally and that expose Promise-based public APIs that
  also support legacy callback patterns.

## 1.10.0 - 2018-04-06

### Added
- `--log-exclude` option to eliminate logging from certain modules.

## 1.9.2 - 2018-03-28

### Changed
- Update to newer worker API.
- Improve errors in runOnce calls.
- Use logger to handle uncaught error formatting.

## 1.9.1 - 2018-03-07

### Changed
- Update from istanbul to nyc for coverage.

## 1.9.0 - 2018-03-01

### Changed
- Update jsonld to 1.0.0.

## 1.8.0 - 2018-02-13

### Changed
- Update jsonld to 0.5.x.
- Update many other dependencies.

### Added
- `--log-only` option to log only certain modules.

## 1.7.1 - 2017-11-13

### Fixed
- Update mocha dependency which addresses multiple security vulnerabilities.

## 1.7.0 - 2017-08-10

### Added
- Add `assertNoError(err)` global test helper which makes an assertion that
  `err` should be falsy. If an error does occur, the full error will be
  logged to the console. The additional logging is helpful when troubleshooting
  tests that are failing due to a regression. This helper should be used in
  place of the commonly used `should.not.exist(err)` assertion.

## 1.6.0 - 2017-07-27

### Changed
- Upgrade test related dependencies: mocha, chai, chai-as-promised.

## 1.5.0 - 2017-07-24

### Added
- Add `child(meta)` method to create a child logger with common metadata for
  each logging call. The special `module` meta key can be used to prefix
  messages with `[module] ` and is removed from the message details.
  `child(name)` is a shortcut for `child({module: name})`.

## 1.4.1 - 2017-02-02

### Changed
- Deprecated default values for `config.paths`. A warning will be printed.  A
  future major version will force values to be set by applications.

## 1.4.0 - 2016-12-09

### Added
- Add `config.paths` with `log` and `cache` entries. This is designed to be a
  simple single point of configuration for the root logging and cache paths.

### Changed
- Use computed configs:
  - Add common cache and log paths to config.paths.
  - Use common log path for default log files.

## 1.3.0 - 2016-12-07

### Added
- Add `bedrock.util.config` utilities:
  - Add `bedrock.util.config.Config` OO wrapper API.
  - Common `bedrock.util.config.main` Config wrapper for `bedrock.config`.
  - See README for usage details.
- ci-test target with tap mocha reporter.

### Changed
- Updated dependencies.
- Updated to node >= 6.

## 1.2.5 - 2016-07-29

### Fixed
- Fix chown bug when posix doesn't exist and usernames are used.

## 1.2.4 - 2016-06-09

### Changed
- Improve logging of simple object unhandled errors.

## 1.2.3 - 2016-06-01

### Changed
- Use improved common uncaught exception handler.

## 1.2.2 - 2016-05-30

### Changed
- Update docs.
- Update jscs linter rules.

## 1.2.1 - 2016-04-04

### Fixed
- `enableChownDir` check typo.

## 1.2.0 - 2016-03-30

### Added
- `bedrock.config.loggers.*.bedrock` for bedrock specific options.
- Add `...bedrock.enableChownDir` boolean option to control `chown`ing file
  logger directory to runtime userId.

## 1.1.1 - 2016-02-22

### Fixed
- Check `config.loggers` properties are Objects before accsesing
  sub-properties.  Fixes older configs that set other non-Object meta-data
  along with loggers.

## 1.1.0 - 2016-02-11

### Added
- Add simpler and more explicit mechanism for adding new winston transports.
  Now a call to `bedrock.loggers.addTransport` can be made in event listeners
  handling the `bedrock-loggers.init` event.

## 1.0.10 - 2016-01-31

### Changed
- Updated dependencies.

## 1.0.9 - 2015-10-27

### Changed
- Updated jsonld.js to 0.4.2 to get URDNA2015 support.

## 1.0.8 - 2015-10-15

### Changed
- Initialize jsonld document loader in `bedrock.init` event phase. Done to
  allow access to fully setup config. Warn if default document loader is used
  before jsonld initialized.

### Fixed
- `bedrock.config.jsonld.strictSSL` used if available to configure jsonld
  document loader.

## 1.0.7 - 2015-10-15

### Changed
- `exit` now calls worker kill() vs disconnect() and process.exit(). Appears to
  be more correct and works around a bug in node 4.x.

## 1.0.6 - 2015-09-15

### Changed
- Update posix version to be compatible with node 4.0.0.

## 1.0.5 - 2015-09-14

### Changed
- Updated jsonld and other versions.

## 1.0.4 - 2015-08-27

### Changed
- Updated async to version 1.4.x.

## 1.0.3 - 2015-07-16

### Fixed
- Bug that caused workers to not be restarted.

## 1.0.2 - 2015-07-12

### Fixed
- Handle cycles in log message meta data.

## 1.0.1 - 2015-05-07

### Changed
- Update dependencies.

## 1.0.0 - 2015-04-08

### Changed
- **BREAKING**: A new event `bedrock.admin.init` was introduced that emits
  prior to `bedrock.init`. This new event is emitted while the process has
  any elevated privileges and after it is handled, elevated privileges are
  dropped. This changes `bedrock.init` so that it runs without elevated
  privileges. This only affected `bedrock.server` in a negative way; this
  module has been updated to comply with the change. Also, `bedrock.init`
  should no longer be used to emit custom events; these should be deferred
  to `bedrock.start` to prevent scenarios where a listener of an event
  emitted by one module can't use the API of another unrelated module because
  it hasn't been initialized yet. Deferring custom event emitting to
  `bedrock.start` as a best practice avoids this scenario.
- Updated JSCS rules.

## 0.3.2 - 2015-02-24

### Fixed
- Fixed default command after upgrade to commander 2.6.

## 0.3.1 - 2015-02-23

### Changed
- Updated commander to version 2.6.0.

## 0.3.0 - 2015-02-16

### Breaking Changes

- Major package reorganization:
  - Files split into many sub-projects.
  - Bedrock server split into `bedrock-*` modules.
  - Bedrock frontend components split into `bedrock-angular-*` modules.
- Infrastructure changed to make composing a project from modules much easier.
- **bedrock**:
  - New event system for module initialization and communication.
  - Removed old bedrock.modules API.
  - `config.app.*` changed to `config.core.*`.
  - `config.server.workers` changed to `config.core.workers`.
  - Various code moved to modules or removed (`iso8601` library, etc)
  - `bedrock.security` API removed. Other libraries such as `jsonld-signatures` can be used.
  - `bedrock.tools` renamed to `bedrock.util`; `bedrock.tools` is deprecated.
  - Config files:
    - Most files moved as examples in `bedrock-seed`.
    - Some values added as defaults in appropriate modules.
    - `configs` dir removed.
    - Development uses defaults.
    - Testing uses `lib/test.config.js`.
  - Removed `config.environment` in favor of feature flags.
  - `config.core.starting.groupId` and `config.core.starting.userId` used for
    master before logging initialized.
  - `config.core.running.groupId` and `config.core.running.userId` used for
    master and workers after logging initialized.
  - `config.core.errors.showStack` used to control general error stack traces.
  - `config.jsonld.strictSSL` used to control strict SSL of jsonld library.
  - `config.views.serviceUnavailable` to control 503 Service Unavailable for
    all requests.
  - `config.core.masterTitle` changed to `config.core.master.title`.
  - `config.core.workerTitle` changed to `config.core.worker.title`.
  - `config.core.restartWorkers` changed to `config.core.worker.restart`.
  - Remove uses of `MODULE_NS`.
  - Remove prefixes from errors and use simpler names.
  - Change many `*NotFound` error types to just `NotFound`.
- **mail**:
  - Per-module mapper files removed.
  - Modules push event handlers to `bedrock.config.mail.events` array:
    - `{type: 'EVENT-TYPE', template: 'TEMPLATE-HANDLER-ID'}`
  - Modules set config objects in `bedrock.config.mail.templates.config[ID]`:
    - `{filename: 'FULL-FILENAME', [disabled: true]}`
- **express**:
  - `config.server.cache.*` renamed to `config.express.cache.*`.
  - `config.server.session.*` renamed to `config.express.session.*`.
  - `config.server.static` renamed to `config.express.static`.
  - `config.server.staticOptions` renamed to `config.express.staticOptions`.
  - `config.express.useSession` to control session support.
  - `config.express.dumpExceptions` to control error exceptions.
  - `config.express.showStack` to control error stack traces.
- **i18n**:
  - `config.website.i18nPaths` renamed to `config.i18n.localePath`.
  - `config.website.writeLocales` renamed to `config.i18n.writeLocales`.
- **schemas**:
  - Schemas moved to `bedrock-validation` and other modules.
  - Modules push paths to `bedrock.config.validation.schemas.paths` array.
- **mongodb**:
  - `config.database` changed to `config.mongodb`.
  - `bedrock-mongodb` module now uses version 2.x of the Node.js driver, see [Migrating to 2.X](http://mongodb.github.io/node-mongodb-native/2.0/tutorials/changes-from-1.0/).
  - Support for mongodb 2.2 has been dropped.
- **cli**:
  - `-R/--reporter` changed to `--mocha-reporter`.
- **views**:
  - `config.website.views` moved to `config.views`.
  - `config.views.vars` are now shared between client and server templates except for any vars under `_private` which are server-only.
  - `config.views.vars.clientData` has been removed.
  - `config.views.vars.session` moved to `config.views.vars.idp.session`.
  - A number of unused keys in `config.views.vars` have been removed: `session.auth`, `session.loaded`, `serviceHost`, `serviceDomain`, `productionMode`.

## 0.2.0 (up to early 2015)

- See git history for changes.
