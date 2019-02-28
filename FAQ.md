# Note: This FAQ is out-of-date for Bedrock 0.3+.

# Development

## How do I setup a local bedrock development environment?

See the [CONTRIBUTING][] documentation for full details.

## What should my mongo database config look like?

If you choose to use the MongoDB module, a simple config like the following
is fine:

    dbpath=/var/lib/mongodb
    logpath=/var/log/mongodb/mongodb.log
    logappend=true
    journal=true
    auth = true

## I'm getting an 'auth fails' Mongo error on startup. What's wrong?

If you are using the MongoDB module, when the system first starts up it will
connect to MongoDB as an administrator and create all of the necessary
databases for Bedrock. If you get an 'auth fails' message, the most likely
culprit is that the admin username and password you're using is wrong, or
you forgot to setup a database admin.

Check to make sure that the admin username and password is correct by logging
into MongoDB manually:

    > mongo
    > use admin
    > db.auth('admin', 'password')

The command above assumes that 'admin' is the username and 'password' is your
password. If it's not, put in whatever your admin username and password is
at the time. The three commands above should return 1 (success). If the
return value is 0, then your admin user isn't configured correctly. Refer to
[CONTRIBUTING][] to learn how to configure the MongoDB administrator.

## How do I clear all Bedrock data from the MongoDB database?

Make sure that the Bedrock process has been halted, then drop the master
Bedrock database and the local Bedrock database collection:

    > mongo
    > use admin
    > db.auth('admin', 'password')
    > use bedrock_dev
    > db.dropDatabase()
    > use local
    > db.bedrock_dev.drop()
    > exit

# Licensing

## Is Bedrock Open Source?

No. It does not fit any of the OSI-approved definitions for 
"Open Source Software" primarily because we restrict its 
use to non-commercial use. Commercial use requires a license.

You can look at and contribute to the source. You can use it
for non-commercial projects. The next question in the FAQ
explains why we have decided to release Bedrock under this
model.

## Why isn't this released under an open source license?

Our company loves open source. We release many of our projects under
GPLv2, AGPLv3, MIT, BSD, and Creative Commons licenses. We 
contribute heavily to the open source world and benefit greatly from
open source software.

There are a number of reasons that this particular product isn't
open source:

* We need to feed our families and this product generates revenue for us.
* We need to fund development of our core company products and
  we currently believe that releasing this product as open source
  will not enable us to do that.
* We have tried the "pay for support" open source model and it has not
  worked very well for our company. Very large companies, far bigger
  than ours, regularly benefit from our work and provide nothing in
  return.

We wish this were not true. We wish we could just develop great 
technology, release it to the world, and people would pay us for it.
To date, the revenue we've received from other large companies that have
benefited from projects we've open sourced wouldn't even cover a month
of operations. The reality is that large companies don't pay small
companies for their work unless they absolutely have to.

That said, we do also want to be a good citizen of the Web. We want to
help students, researchers, hobbyists, and non-commercial enterprises
use our software for research and the greater good. That is why we have
decided to try a middle path - a non-commercial license for the software.
This approach ensures that we help those that can't afford a commercial
license while not putting ourselves out of business.

In the future, we hope to include contributors to the project in a split
of the revenue. We are still working out the details on how to do that
fairly, but that's the direction we're headed. We want this software to
put food on the table for not just us, but all contributors to the project
as well.

## I work for a startup, is Bedrock expensive to license?

No, it's quite affordable for a startup and we're very careful to not
endanger the startup with ill-timed license fee schedules. We work 
with startups on a regular basis and we want them to succeed because 
we want them to become customers.

## I work for a major corporation, is Bedrock expensive to license?

Bedrock easily provides a 10x return on investment for a large company.
It took years to write and refine it, which is money that your organization
does not have to spend making the same mistakes that we did.

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[CONTRIBUTING]: CONTRIBUTING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md
