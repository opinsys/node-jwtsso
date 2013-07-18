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

Request JWT token from `/login`

```javascript
app.get("/login", function(req, res){
    res.requestJwt("/display_jwt");
});
```
This redirects user to

    https://jwtsso.example.com/sso?return_to=http%3A%2F%2Fmyapp.example.com%2Fdisplay_jwt

From there user is expected to be redirected back to `return_to`
url with the JWT token

    http://myapp.example.com/display_jwt?jwt=<token>

Then on `/display_jwt` we can inspect the `req.jwt` variable

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

