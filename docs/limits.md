### Access Limits

There are a number of ways a client may be restricted from using the API
outside of the typical authorization flow. These restrictions include:

* Rate Limiting
* Distributed Denial of Service Limiting

The following sections detail when and how each type of limiting may be
used on a client.

#### Rate Limiting

Rate limiting is used to reduce a single client's ability to affect the
REST API services that this website provides. Rate limiting happens at a
rate of roughly 10 requests per second per client for unauthenticated
connections and at a rate of 50 requests per second per client for
authenticated connections.

#### Distributed Denial of Service Limiting

If an excessive rate of requests is sent from multiple clients in a particular
subnet, then the entire subnet may be rate limited at a rate of 1 request per
second per client.