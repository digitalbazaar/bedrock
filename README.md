Bedrock
=======

When creating a Web app, you need a good foundation on which to build. There
are a lot of disparate technologies out there that can be brought together into
a cohesive whole to make this happen. The trouble is in finding, vetting,
testing, and combining these technologies -- all of which needs to happen
before you can begin to make serious progress on your own project.

Bedrock helps you launch your ideas faster by bundling all the best-of-breed
tooling that's necessary to build a modern, scalable Web app. It creates a
solid foundation on which you can build, letting you focus on your
project-specific needs.

Bedrock can run on a low-powered laptop all the way up to enterprise servers
serving tens of millions of transactions per day.

Bedrock uses a modular design to help keep code well-organized and to allow an
ecosystem to grow without unnecessary hindrance. Bedrock keeps its core simple:
it provides a powerful configuration system, an event-based API, Linked
Data-capabilities, and testing infrastructure that makes writing interactive
modules easy. Bedrock is an opinionated, but flexible framework; it tells
developers that there's one recommended way to accomplish a task, but if need
be, a developer can go in another direction. Many of Bedrock's modules attempt
to emulate this approach, creating organizing priniciples and clear guidelines
for developers to follow that help break down problems and reduce cognitive
load.

Bedrock uses node.js and runs on Linux, Mac OS X, and Windows.

TODO: list of recommended modules

bedrock-server provides a core, cluster-based HTTPS server.

bedrock-express provides an Express server with reasonable
defaults and extra features like the ability to layer static
files and directories to support overrides.

bedrock-mongodb provides an API for connecting to a MongoDB
database and creating and using collections.

bedrock-jobs provides a background job scheduler.

bedrock-requirejs provides a client-side module loader and
autoconfiguration capabilities for bower components.

bedrock-views provides server-rendered views with HTML5 + Bootstrap3.

bedrock-angular layers on top of bedrock-views to provide client-rendered
AngularJS views.

bedrock-idp provides user identity and public key management.

Other Bedrock modules provide REST APIs, user account management, strong
cryptography support, DoS protection, digital signatures, Linked Data, and
tons of other [FEATURES][]. If you don't need all the fancy features, Bedrock
is modular, so you can use only the modules you want.

Quickstart
----------

You can follow the following tutorial to setup and use Bedrock on a Linux or
Mac OS X development machine.

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
3. Login as the admin `admin` with the password `password` or create a new
   account.

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

See the [CONTRIBUTING][] file for various details for coders about
hacking on this project.

Authors
-------

See the [AUTHORS][] file for author contact information.

License
-------

Bedrock and all Bedrock modules are:

    Copyright (c) 2011-2015 Digital Bazaar, Inc.
    All Rights Reserved

You can use Bedrock for non-commercial purposes such as self-study, research,
personal projects, or for evaluation purposes. See the [LICENSE][] file for
details about the included non-commercial license information.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[CONTRIBUTING]: CONTRIBUTING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md
