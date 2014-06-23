# Bedrock Hacking

Details for developers about hacking on the Bedrock code.

## Code Style

### JavaScript

Follow these rules as strictly as possible; only stray if there's a Very Good
Reason To (TM).

* Two-space indentation, NO tabs.
* Same-line curly brackets, keep else/elseif/catch/while on the same line
  as a related ending bracket.
* No extra spaces after if, while, etc. before the parenthetical.
* Use semicolons.
* Use camelCase for variables, method names, etc. Only use underscores as a
  prefix for "private" functions or variables that really need to be
  distinguished as such.
* Return early and avoid else if possible.
* Use continuation-passing-style (callbacks) when writing node.js code as
  it is popular practice there. Use Promises in client-side code. If Promises
  and other generator-related tech begin to become popular in node.js then
  we will switch to that. We want our code to be as compatible as possible
  with the community and idiomatic in the environments in which it is run.
* Use async for callback management: [https://github.com/caolan/async]()
* Prefer single quotes for strings. Only use double quotes when it would
  result in fewer escape sequences. If there's any HTML that must be written
  in a JS-string, it will be easier with single-quotes as you won't have
  to escape any the HTML double quoting.
* Prefer one variable declaration per line, no elaborate indentation, and
  declare nearest to where variables are used. You may declare simple iterator
  vars for loops multiple times in the same function, functional-scope
  notwithstanding.
* Do not use trailing commas (for example: [foo, bar,]).
* Line break at 80 chars; if you must line break for function parameters, line
  break at the opening parenthesis and move all parameters down, do not
  break in the middle of the parameter list. The only exception to this is
  if a parameter is an object with too many properties to fit on a single
  line; you may break after the opening object bracket for this. Break before
  periods for chaining function calls.
* Avoid getters and setters.
* Do not override built-in prototypes unless you're fixing IE.
* If you find a need to use OOP, use PascalCase for classes. Avoid OOP unless
  there's a really good justification for the added complexity. OOP is not a
  panacea, it is a tool for a very specific problem set. If it is used for
  a problem that is not in that set, there are only disadvantages. Examples
  include, but are not limited to: unused layers of abstraction and overhead
  that affect both runtime and development time, more indirection that must
  be traced during debugging, decreased ratio of effectual code lines to lines
  of code, and stacktrace horrors.

### AngularJS

Organize files according to "components". Components are collections of
controllers, services, directives, filters, and templates that are all
part of the same submodule or feature:

    .
    `-- app
        |-- components
        |   `-- fooBar
        |       |-- foo-bar.js
        |       |-- foo-bar-controller.js
        |       |-- foo-bar-service.js
        |       |-- foo-bar-directive.js
        |       |-- foo-bar-filter.js
        |       |-- foo-bar.html
        |       |-- foo-bar-modal-directive.js
        |       |-- foo-bar-modal.html
        |       |-- foo-bar-selector-directive.js
        |       `-- foo-bar-selector.html
        `-- components.js

Each JavaScript file will be an AMD file. The file "foo-bar.js" will be
responsible for loading all of the controllers, services, directives, and
filters modules. It will also have the angular.module('app.fooBar') definition
and will define each controller, service, directive, and filter on that
angular module.

The file "components.js" is an AMD module that will load all components
that are used by the app and register them as dependencies for an
'app.components' angular module.

Naming conventions:

All files use lowercase and hyphens as a word delimiter. Variables use
camelCase and controllers are services .

Controllers:

* Name: FooBarController (PascalCase)
* File: foo-bar-controller.js

Services:

* Name: FooBarService (PascalCase)
* File: foo-bar-service.js

Directives:

* Name: fooBar (camelCase)
* File: foo-bar-directive.js

Filters:

* Name: fooBar (camelCase)
* File: foo-bar-filter.js

Templates:

* Name: foo-bar.html

Modals:

* Name: fooBarModal (camelCase)
* File: foo-bar-modal-directive.js
* Template: foo-bar-modal.html

Selectors:

* Name: fooBarSelector (camelCase)
* File: foo-bar-selector-directive.js
* Template: foo-bar-selector.html

## Debugging

Similar to the NODE_DEBUG environment setting, there is a BEDROCK_DEBUG
environment setting. This is a comma separated list of modules to debug. The
current known options are:

* test: Debug the testing framework.

To use, run commands like the following:

    BEDROCK_DEBUG=test npm run test

## Testing

* Backend tests are located in `tests/backend/`.
* Frontend tests are located in `tests/frontend/`. These tests use
  protractor to test a web browser.
* Use BEDROCK_DEBUG=test to show additional debug info.

The following projects are used for creating tests:

* https://github.com/admc/wd
* http://visionmedia.github.io/mocha/
* https://github.com/domenic/mocha-as-promised
* http://chaijs.com/
* https://github.com/domenic/chai-as-promised
