Bedrock
=======

A core foundation for a rich application server.

Building the Software
---------------------

1. npm install

Running the Development Bedrock Server
--------------------------------------

1. npm run dev

Running the Tests
-----------------

Run all unit and system tests:

1. npm run test

Run just the unit tests:

1. npm run test-unit

Run just the system tests:

1. npm run test-system

Running the Code Coverage Tool
------------------------------

1. npm run coverage
2. Look at 'coverage.html' using a web browser

Minimizing the RequireJS client-side JS
---------------------------------------

1. npm run minify
2. To test in dev mode, set the website config var 'minify' to true.

Generating a new self-signed SSL certificate for testing
--------------------------------------------------------

1. nodejs create-credentials.js
2. Save the generated private key and certificate PEMs in the
   appropriate files (in ./pki/ if using the default config).

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
[HACKING]: HACKING.md
[LICENSE]: LICENSE.md
