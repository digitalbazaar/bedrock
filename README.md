Bedrock
=======

A core foundation for a rich Web application server.

Quickstart 
----------

You can follow the following tutorial to setup and use 
Bedrock on a Linux or Mac OS X development machine.

Requirements
------------

* Linux or Mac OS X (also works on Windows with some coaxing)
* node.js >= 0.10.x
* npm >= 1.4.x
* mongodb ~= 2.4.x (optional, but strongly recommended)

Setup
-----

1. Setup an admin user on mongodb (see below)
2. Map the `bedrock.dev` hostname to your machine (see below).
3. git clone git@github.com:digitalbazaar/bedrock.git
4. cd bedrock && npm install
5. [optional] Tweak config settings in configs/dev.js

To setup an admin user on mongodb:

1. mongo
2. use admin
3. db.addUser( { user: "admin", pwd: "password", roles: [ "clusterAdmin", "readWriteAnyDatabase", "userAdminAnyDatabase", "dbAdminAnyDatabase"] } )

To setup the `bedrock.dev` hostname:

1. Edit the /etc/hosts file as the administrator/root.
2. Add an entry mapping the IP address to `bedrock.dev`. 
   For example: `192.168.0.15 bedrock.dev` (where `192.168.0.15` 
   is the IP address of your primary network device.

Running Bedrock
---------------

Run the following to start up a development server from the source directory:

    node bedrock.dev.js

To add more verbose debugging, use the `--log-level` option:

    node bedrock.dev.js --log-level debug

To access the server:

1. Go to: https://bedrock.dev:22443/
2. The certificate warning is normal for development mode. Accept it and 
   continue to the landing page. 
3. Login as the admin `admin` with the password `password` or create a new account.

Running the Tests
-----------------

Install protractor (before first test run):

    npm run install-protractor

Run all backend and frontend tests:

    npm run test

Run just the backend tests:

    npm run test-backend

Run just the frontend tests:

    npm run test-frontend

Run a specific frontend test suite:

    nodejs test.js --frontend --suite unit

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
--------

For a complete list of features included in Bedrock, see the [FEATURES][] file.

FAQ
---

See the [FAQ][] file for answers to frequently asked questions.

Hacking
-------

See the [HACKING][] file for various details for coders about
hacking on this project.

Authors
-------

See the [AUTHORS][] file for author contact information.

License
-------

Bedrock and all Bedrock modules are:

    Copyright (c) 2011-2015 Digital Bazaar, Inc.
    All Rights Reserved

You can use Bedrock for non-commercial purposes such as self-study, 
research, personal projects, or for evaluation purposes. See 
the [LICENSE][] file for details about the included 
non-commercial license information.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[HACKING]: HACKING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md
