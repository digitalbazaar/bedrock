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
  - `config.server.workers` changed to `config.app.workers`.
  - Various code moved to modules or removed (`iso8601` library, etc)
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
- **cli**:
  - `-R/--reporter` changed to `--mocha-reporter`.

# 0.2.0 (up to early 2015)

- See git history for changes.
