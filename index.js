
var url = require("url");
var extend = require("xtend");
var jwt = require("jwt-simple");

// https://npmjs.org/package/jwt-simple

function puavoAuth(options) {
    options = extend({
        maxAge: 60
    }, options);

    return function(req, res, next) {
        res.jwtRequest = function(returnTo) {
            var redirectUrl = url.parse(options.authEndpoint, true);
            redirectUrl.search = undefined;

            returnTo = url.resolve(options.mountPoint, returnTo || req.path);

            redirectUrl.query = extend(redirectUrl.query, {
                return_to: returnTo
            });

            res.redirect(redirectUrl.format());
        };

        req.jwt = {};
        if (!req.query.jwt) return next();

        try {
            var claims = jwt.decode(req.query.jwt, options.sharedSecret);
            var iat = parseInt(claims.iat, 10);
            if (!iat) throw new Error("iat field is missing");
            var age = Date.now() - iat*1000;
            if (age > options.maxAge) throw new Error("token is too old");
            var exp = parseInt(claims.exp, 10);
            if (exp && exp*1000 < Date.now())throw new Error("token has expired");
            req.jwt.claims = claims;
        } catch(err) {
            req.jwt.error = err;
        }

        next();
    };
}


module.exports = puavoAuth;
