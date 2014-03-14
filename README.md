Bedrock
=======

A core foundation for a rich application server.

Building the Software
---------------------

    npm install

Running the Development Bedrock Server
--------------------------------------

    npm run dev

Running the Tests
-----------------

Run all unit and system tests:

    npm run test

Run just the unit tests:

    npm run test-unit

Run just the system tests:

    npm run test-system

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
-------

For a complete list of features included in Bedrock, see the [FEATURES][] file.

Hacking
-------

See the [HACKING][] file for various details for coders about
hacking on this project.

Authors
-------

See the [AUTHORS][] file for author contact information.

License
-------

See the [LICENSE][] file for license information.

Copyright
---------

Copyright (c) 2011-2014 Digital Bazaar, Inc. All rights reserved.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[HACKING]: HACKING.md
[LICENSE]: LICENSE.md
