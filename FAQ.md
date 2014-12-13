# Development

## How do I setup a local bedrock development environment?

See the [HACKING][] documentation for full details.

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
[HACKING][] to learn how to configure the MongoDB administrator.

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

[AUTHORS]: AUTHORS.md
[FEATURES]: FEATURES.md
[HACKING]: HACKING.md
[FAQ]: FAQ.md
[LICENSE]: LICENSE.md