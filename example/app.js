
var express = require("express");
var jwtsso = require("../index");
var PORT = 1234;

var app = express();

app.use(express.cookieParser());
app.use(express.cookieSession({ secret: "secret" }));
app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: "https://esanboot2.kehitys.opinsys.fi/v3/remote_auth",

    // Shared secret string with the above service
    sharedSecret: "secret",

    // Public mountpoint for this app
    mountPoint: "http://esanboot2.kehitys.opinsys.fi:1234",

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120
}));


app.use(function(req, res, next) {
    if (req.path === "/logout") return next();

    if (!req.session.jwt) {
        console.log("Requesting jwt");
        res.requestJwt();
    }
    else {
        console.log("we have jwt, yay");
        next();
    }
});

app.get("/logout", function(req, res) {
    req.session = null;
    res.setHeader('Content-Type', 'text/html');
    res.end("you're out. <a href=foobar>back</a>");
});

app.get("/*", function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end([
            "<p>",
            "Session data:",
            "</p>",
            "<pre>",
            JSON.stringify(req.session.jwt, null, "  "),
            "</pre>",
            "<a href=logout>logout</a>"
    ].join(" "));
});

app.listen(PORT, function(err) {
    if (err) throw err;
    console.log("http://localhost:"  +  PORT);
});

