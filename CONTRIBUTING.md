# Contributing to Bedrock®

Details for developers about contributing to the Bedrock® code.

## Commit Messages

When writing your git messages, imagine them being read like this:

`If applied, this commit will <the first line of your git message here>.`

* Use present imperative tense, so it's read as: If applied, this commit will "your subject line here".
* Start with a capital letter; use proper capitalization throughout, end with a period.
* Keep the first message under 50 chars if possible, (certainly under 80). It should express a basic summary of the changeset. Be specific, don't just say "Fix the bug."
* If you have more to express after the summary, leave an empty line after the opening summary and then express whatever you need in an extended description.
* If you need to reference issues, then after the optional extended description, leave an empty line and then use `Addresses #issue-number` (for example).

Example commit messages:

```
Add infinite scroll to comment section.

- Replaces existing pagination mechanism with an infinite scroll feature.
- Future work includes CSS-animated fireworks when new comments arrive.

Addresses #123.
```

```
Fix memory leak in animation runner.

When canceling an animation, a closure was created that had a reference
to a DOM element that caused it to be held indefinitely in jquery's cache.
The closure has been reworked to avoid the reference.

Addresses #124.
```

## ChangeLogs

Packages should include a top-level `CHANGELOG.md` file.

* Keep the `CHANGELOG.md` up-to-date *as you make commits*.
* Entries should be a higher level view than reading all the commit messages.
  In general, developers should be able to just read this to stay updated while
  upgrading.
* Use a simplified version of the https://keepachangelog.com/ style.
  * Don't make version links, this is difficult to maintain.
* Prefix lines with `**BREAKING**:` or `**NOTE**:` or similar as needed.
* When creating PRs, include a date template (with only the year, not the
  actual month and date) following the version, like this:
  `## 14.3.0 - 2024-mm-dd`. The release manager for a package will set the
  month and date during the release process.
* Do not update the version in `package.json` files to match the changelog
  manually, because the release software will do this automatically. Setting
  it manually will cause the release software to misbehave. New repositories
  should always set the version in `package.json` to `"0.0.1-0"`.

## Code Style

### JavaScript

Follow these rules as strictly as possible; only stray if there's a Very Good
Reason To (TM).

* Two-space indentation, NO tabs.
* Same-line opening curly brackets, keep else/elseif/catch/while on the same
  line as a related opening bracket; put one space before opening brackets.
* Drop closing curly brackets if they are not on the same line as the opening
  bracket due to other rules causing line breaks.
* Do NOT drop a closing parenthesis just because it is not on the same line as
  the opening parenthesis, but only when they also follow a dropped closing
  curly bracket. Curly braces express objects and isolated scopes and should
  be dropped to visually indicate this, whereas parentheses do not and this
  can cause visual confusion.
* No extra spaces after if, while, etc. before the parenthetical.
* Use semicolons.
* Use camelCase for variables, method names, etc. Only use underscores as a
  prefix for "private" functions or variables that really need to be
  distinguished as such.
* Return early and avoid else if possible.
* Use promises for asynchronous code, with a preference for async/await syntax.
* Prefer single quotes for strings. Only use double quotes or backticks when it
  would result in fewer escape sequences.
* Prefer one variable declaration per line, no elaborate indentation, and
  declare nearest to where variables are used.
* Do not use trailing commas (for example: [foo, bar,]).
* Line break at 80 chars; if you must line break for function parameters, line
  break at the opening parenthesis and move all parameters down, do not
  break in the middle of the parameter list. The only exception to this is
  if a parameter is an object with too many properties to fit on a single
  line; you may break after the opening object bracket for this. Break before
  periods for chaining function calls.
* Use the latest JS syntax supported by stable node.js everywhere; we will run
  babel tools to compile for browsers or older versions of node.js as needed.
* When writing arrow functions (`=>`), if they can be kept on a single
  line, do so. Functions are just mappings from x to y (or `x => y`); it
  is easier to read when they are short and on a single line. If the
  function is longer (or requires curly braces `{`), break after the
  arrow. See examples.
* Avoid getters and setters.
* Do not override built-in prototypes unless you're fixing IE.
* If you find a need to use OOP, use PascalCase for classes. Avoid OOP unless
  there's a really good justification for the added complexity (e.g. you really
  need to bundle up and maintain some state and have actual use for inheritance
  patterns). OOP is not a panacea, it is a tool for a very specific problem set.
  If it is used for a problem that is not in that set, there are only
  disadvantages. Examples include, but are not limited to: unused layers of
  abstraction and overhead that affect both runtime and development time, more
  indirection that must be traced during debugging, decreased ratio of effectual
  code lines to lines of code, and stacktrace horrors.
* See: http://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html

#### Examples

##### Arrow functions:

If an arrow function will all fit on one line, do it:

```js
someLongFunctionOrExpression(
  a, b,
  (some, long, params) => someExpression());
```

If it won't fit on one line, then break after the arrow:

```js
someLongFunctionOrExpression(
  a, b, (some, long, params, tooManyParams) =>
  someExpressionThatIsJustTooLong());
```

#### Linter

A number of style and code rules can be checked with [ESLint](https://eslint.org/).

    $ npm run lint

## Testing

* Backend tests are typically written using the mocha framework.
* Frontend tests are typically written using protractor to test a web browser.

The following projects are used for creating tests:

* https://github.com/admc/wd
* http://visionmedia.github.io/mocha/
* http://chaijs.com/
* https://github.com/domenic/chai-as-promised
