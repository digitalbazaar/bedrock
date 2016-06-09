# bedrock ChangeLog

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
