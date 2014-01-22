Bedrock
=======

A core foundation for a rich application server.

Copyright (c) 2011-2014 Digital Bazaar, Inc. All rights reserved.

Building the Software
---------------------

1. npm install

Running the Development Bedrock Server
--------------------------------------

1. npm run dev

Running the Tests
-----------------

1. npm run tests

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
