
# jwtsso

[JSON Web Token][jwt] Single Sign-On consumer middleware for [Express][].

## Example

Setup Express app with jwtsso

```javascript
var express = require("express");
var jwtsso = require("jwtsso");

var app = express();

app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: "https://jwtsso.example.com/sso",

    // Shared secret string with the above service
    sharedSecret: "secret",

    // Public mountpoint for this app
    mountPoint: "http://myapp.example.com",

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120
}));
```

Redirect user to
`https://jwtsso.example.com/sso?return_to=http%3A%2F%2Fmyapp.example.com%2Fdisplay_jwt`

```javascript
app.get("/login", function(req, res){
    res.requestJwt("/display_jwt");
});
```

`https://jwtsso.example.com/sso` is expected to redirect the user back with a
JWT token to the given `return_to` url.

```javascript
app.get("/display_jwt", function(req, res){

    // If JWT token is signed with invalid shared secret, is too old, or expired
    // the error will be set to req.jwt.error
    if (req.jwt.error) {
        return res.json(401, { message: "bad jwt token" });
    }

    // If everything is ok verified data can be found from req.jwt.claims
    if (req.jwt.claims) {
        return res.json(req.jwt.claims);
    }

    return res.json(401, { message: "No jwt  data" });
});
```


[Express]: http://expressjs.com/
[jwt]: http://tools.ietf.org/html/draft-jones-json-web-token

