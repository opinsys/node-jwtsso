[![Build Status](https://travis-ci.org/opinsys/node-jwtsso.png?branch=master)](https://travis-ci.org/opinsys/node-jwtsso)

# jwtsso

[JSON Web Token][jwt] Single Sign-On consumer middleware for [Express][].

## Usage

Setup Express app with jwtsso and session middleware

```javascript
var express = require("express");
var jwtsso = require("jwtsso");

var app = express();

app.use(express.cookieParser());
app.use(express.cookieSession({ secret: "secret" }));
app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: "https://api.authprovider.example/sso",

    // Shared secret string with the above service
    sharedSecret: "secret",

    // Public mountpoint for this app
    mountPoint: "http://application.example",

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120

}));
```

Now from any route or latter middleware you can call `res.requestJwt()` to get
a JWT token from the `authEndpoint`. The token will be saved to
`req.session.jwt`.

For example to ensure that JWT token is always present you can add following
additional middleware

```javascript
app.use(function(req, res, next){
    if (!req.session.jwt) return res.requestJwt();
    next();
});
```

By default `res.requestJwt([custom path])` will redirect back to same url where
it was called from or you can pass in a custom path.

## Authentication endpoint

Under the hood call to `res.requestJwt()` on `/current/path` redirects user to

    https://api.authprovider.example/sso?return_to=http%3A%2F%2Fapplication.example%2Fcurrent/path

From there authentication endpoint is expected to redirect user back to url
specified in the `return_to` query value with the JWT token

    http://application.example/current/path?jwt=<token>

jwtsso then detects JWT token in the query string, validates it, sets it to
`req.session.jwt` and clears it from the url bar with an additional redirect.

This module was designed for the Single Sign-On feature of puavo-rest

<https://github.com/opinsys/puavo-users/blob/master/rest/doc/SSO.md>


[Express]: http://expressjs.com/
[jwt]: http://tools.ietf.org/html/draft-jones-json-web-token

