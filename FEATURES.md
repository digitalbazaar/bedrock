# Basic Platform Features

This document outlines the basic features of the Bedrock software platform.
Generally speaking, Bedrock is an application framework that allows
Web technology-based products to be built on top of it. The framework removes
the need to build and maintain common application subsystems that deal
with things like logging, application auto-scaling, database access,
online attack mitigation, system modularity, login security, role-based
access control, internationalization, and production-mode optimization.

## Core Subsystems

The core subsystems are foundational to the Bedrock framework and provide
the foundation on which other subsystems are built.

### Config System

A flexible configuration system that provides a robust web server
framework. The config system is customizable so that core
configuration rules have good defaults, but can be overridden. The
system is also extensible so that new config values can be added easily to
any subsystem. All config parameters are overwritable, so that projects that
use the framework can overwrite the defaults. The config system is also
multifile so that subsystems can contain their own logical
configuration without having to scan through a large configuration file.

### Modular Extension Mechanism

There is a modular design for extending core functionality and web
services. Extending the core framework is as easy as overloading a
method. Adding functionality on top of the framework is as easy as
adding a module to a configuration file and re-starting the system.

### CPU Autoscaling and Restart

The web server framework is capable of automatically scaling up to
the number of CPUs available on the system. The cluster module in node.js
is utilized to provide this scaling. Worker processes have the capability
of being auto-restarted in the event that a worker crashes to ensure that
the system can recover from fatal errors.

### Distributed Event API

There is a modularized event API and subsystem that allows the
system to publish and subscribe to events across multiple CPU
cores/processes.

### Logging Subsystem

A logging subsystem is available that is capable of category-based
logging (info, log, debug, mail, etc.). The log files follow typical log
rotation behavior, archiving older logs. There is also the ability to
have a shared log file w/clustered systems and support for multi-file logging.

## Persistent Storage Subsystems

The persistent storage subsystems are used to store system state between
system restarts.

### MongoDB database abstraction layer

The system has a simple database abstraction layer for reading and writing
to MongoDB.

### Redis database abstraction layer

Included is the ability to connect to Redis for simple reading and writing
of values to a fast in-memory database.

### Distributed GUID generator

The ability to create guaranteed unique global IDs (GIDs) is useful when
deploying the web server framework on multiple machines in a cluster
setting. This allows systems to generate unique IDs without having to
coordinate through a central communication mechanism.

## Communication Subsystems

The communication subsystems are used to send communication external to the
system.

### Email Subsystem

The email subsystem is capable of sending emails via typical SMTP. The
emails are template driven in order to support easy customization of
email content. The sending of emails is event driven to ensure
proper non-blocking operation in node.js.

## Security

The security subsystems protect the application against attack or
developer negligence.

### User/Password Authentication

A simple, pluggable user authentication system is available. A good
password-based authentication mechanism is built in. All passwords
are salted and hashed using bcrypt password hashing and
verification. Logins is session-backed with session state stored in
a persistent database (like MongoDB), or in memory if a database subsystem
is not available.

### Role-based Permission System

An extensible permission and roles system for managing access to resources
is available so that there can be a clear delineation between
administrator roles, management roles, and regular roles. Each role
definition should only be able to access resources associated with that
role.

### JSON Schema-based validation

Incoming data can be validated before being passed off to subsystems.
This protects against garbage/fuzzing attacks on REST API endpoints.
JSON Schema is a particularly useful strategy when attempting
to prevent bad data injection and basic parameter checking.

### Public Key Service

A public key service is provided that allows the storage and publishing of
public key data. This service enables a distributed public key infrastructure
for the system, enabling remote websites and programs to receive messages
created by the system and then verify the validity of the messages by
checking the digital signature on the message. Verifying agents must
access the public key service to fetch the key information needed for the
verification step.

### HTTP Signature Authentication

Strong protection of REST API resources is possible using
asymmetric keys (digital signatures). This is in addition to something
like an API key used over HTTPS. There is support code for creating
and storing x509 public/private key pairs.

### DoS and DDoS Protection

There is a simple rate limiter for protecting against Denial of
Service and Distributed Denial of Service attacks.

### Secure Messaging support

The ability to digitally sign and encrypt JSON data and publish it in a
way that can be easily verified via the Web or intranet.

## Linked Data

Linked Data is a way to create a network of machine interpretable data
across different documents and Web sites. It allows an application to start
at one piece of Linked Data, and follow embedded links to other pieces
of Linked Data that are hosted on different sites across the Web. The
Linked Data formats used by the system include JSON-LD and RDFa.

### Linked Identity Data

A Linked Data identity system is provided to assign URL identifiers to
the people and organizations that use the system. The public portion of
the identities, such as names, and publicly available cryptographic public
key data, is published in a machine-readable way. Access to the identity
information is based on a role-based access control system that also allows
private data to be read by authorized agents.

A single identity in the system may be associated with multiple other
identities for separate purposes, such as a personal identity and a business
identity.

### RDFa and JSON-LD Support

Parsers to read in and convert both RDFa and JSON-LD to native data formats
and modify, translate, and process the information are included. Converters
are included to translate from RDFa to JSON-LD and vice-versa.

### Digital Signatures for Linked Data

Subsystems are provided that implement the Secure Messaging specification
enabling JSON-LD to be normalized, hashed, and digitally signed. The subsystem
also enables the verification of any RDF data that has been digitally signed.

## Customer Experience Subsystems

The customer experience subsystems are designed to ensure that the customers
that use the system have a pleasant experience. This involves ensuring that
the interface is elegant, responsive, and works across a variety of mobile,
tablet, and desktop devices.

### Extensible HTML5/CSS3 Templating System

A front-end HTML5 templating system is provided that supports
dynamic views and compiled view caching. The static or dynamic pages of a
site is able to be overridden, allowing for the core web server
framework to provide basic pages while the product pages override certain
aspects of the basic page. This is useful for DRY-based design in template
code, allowing pages to be layered on a case-by-case basis. Rich support
for scalable icons should also be included.

### Internationalization Support

Preliminary internationalization support is included such that particular
parts of an interface could be translated to other languages.

### Minimization of HTML/CSS/JavaScript in Production Mode

Many Web applications (HTML + CSS + JavaScript + Fonts) can grow to be a
megabyte or more in size per page hit. Bedrock contains a good
minification subsystem which provides good debugging support in development
mode and optimized HTML+CSS+Javascript in production mode.

A RequireJS-based frontend with auto-dependency determination is also
provided. The RequireJS-optimizer concatenates and minifies
all Javascript for optimized production sites. AngularJS and Bootstrap-based
frontend with stackable modals and customizable popovers are also
provided. An AngularJS-template compiler w/ Javascript and HTML minification
for single connection load for production sites is available. Grunt-based CSS
concatenation and optimization for production sites makes it easy to
deploy production sites w/ no manual build process necessary.

### AngularJS UI Widgets

Basic Angular UI widgets are available: stackable modals, popovers,
navbar hovercard, duplicate ID checker, generic modal alert, common
alert display, tabs, bootstrap-styled form inputs, and help toggle.

A lazy-compilation widget is also available; it can drastically
improve initial page and widget-readiness for complex UIs by
delaying AngularJS-compilation until it's needed.

## Developer Tooling

The developer tooling allows software engineers to easily build new
applications on top of the framework, debug the system when problems arise,
generate good testing code coverage for the system, and ensure that bug
regressions are caught before deploying the software to production.

### Testing and Continuous Integration Subsystem

A modular testing subsystem that is capable of running both backend unit
tests and browser-based frontend tests. The tests are designed to be run
inside continuous integration frameworks to provide constant feedback on
code coverage and test status as new changes are made to the software built
using Bedrock.

### Chained Exception/Error Reporting

An exception reporting system is useful when errors happen in the depths
of a module and you want them to bubble up to the REST API. The error
system supports chained exception reporting to aid tracing/debugging
the system in development mode. In production mode, the detailed errors are
not shown because sensitive data about the system may be surfaced.

### NPM Integration

The web application framework is contained in a typical npm package
that can be installed as a dependency. The framework is able to be
extended by the project using it via an extensible configuration system
and a layered front-end design.

