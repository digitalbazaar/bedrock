Bedrock Hacking
===============

Details for developers about hacking on the Bedrock code.

Code Style
----------

TODO

Debugging
---------

Similar to the NODE_DEBUG environment setting, there is a BEDROCK_DEBUG
environment setting. This is a comma separated list of modules to debug. The
current known options are:

* test: Debug the testing framework.

To use, run commands like the following:

    BEDROCK_DEBUG=test npm run test

Testing
-------

* Unit tests are located in `tests/unit/`.
* System tests are located in `tests/system/`. These tests use
  webdriver to test the system via a web browser.
* Use BEDROCK_DEBUG=test to show additional debug info.

The following projects are used for creating tests:

* https://github.com/admc/wd
* http://visionmedia.github.io/mocha/
* https://github.com/domenic/mocha-as-promised
* http://chaijs.com/
* https://github.com/domenic/chai-as-promised
