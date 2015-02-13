# 0.3.0 (2015-xx-xx)

## Breaking Changes

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
  - Removed `config.environment` in favor of feature flags.
  - `config.core.starting.groupId` and `config.core.starting.userId` used for
    master before logging initialized.
  - `config.core.running.groupId` and `config.core.running.userId` used for
    master and workers after logging initialized.
  - `config.core.errors.showStack` used to control general error stack traces.
  - `config.jsonld.strictSSL` used to control strict SSL of jsonld library.
  - `config.express.useSession` to control session support.
  - `config.express.dumpExceptions` to control error exceptions.
  - `config.express.showStack` to control error stack traces.
  - `config.views.serviceUnavailable` to control 503 Service Unavailable for
    all requests.
  - `config.core.masterTitle` changed to `config.core.master.title`.
  - `config.core.workerTitle` changed to `config.core.worker.title`.
  - `config.core.restartWorkers` changed to `config.core.worker.restart`.
- **mail**:
  - Per-module mapper files removed.
  - Modules push event handlers to `bedrock.config.mail.events` array:
    - `{type: 'EVENT-TYPE', template: 'TEMPLATE-HANDLER-ID'}`
  - Modules set config objects in `bedrock.config.mail.templates.config[ID]`:
    - `{filename: 'FULL-FILENAME', [disabled: true]}`
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

# 0.2.0 (up to early 2015)

- See git history for changes.
