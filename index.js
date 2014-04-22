var url = require("url");
var extend = require("xtend");
var jwt = require("jwt-simple");

// https://npmjs.org/package/jwt-simple

function jwtsso(options) {
    options = extend({
        maxAge: 60
    }, options);

    return function(req, res, next) {

        res.requestJwt = function(returnTo) {
            var redirectUrl = url.parse(options.authEndpoint, true);
            redirectUrl.search = null;

            returnTo = url.resolve(options.mountPoint, returnTo || req.url);

            redirectUrl.query = extend(redirectUrl.query, {
                return_to: returnTo
            });

            res.redirect(redirectUrl.format());
        };

        if (!req.query.jwt) return next();
        if (!req.session) return next(new Error("jwtsso requires req.session!"));

        var claims = jwt.decode(req.query.jwt, options.sharedSecret);

        // http://tools.ietf.org/html/draft-ietf-oauth-json-web-token-10#section-4.1.6
        var iat = parseInt(claims.iat, 10);
        if (!iat) return next(new Error("iat field is missing"));
        var age = Date.now() - iat*1000;
        if (age > options.maxAge*1000) return next(new Error("token is too old"));

        // http://tools.ietf.org/html/draft-ietf-oauth-json-web-token-10#section-4.1.4
        var exp = parseInt(claims.exp, 10);
        if (exp && exp*1000 < Date.now()) return next(new Error("token has expired"));

        req.session.jwt = claims;

        // Issue new redirect back here to clear the jwt token from the url
        var redirUrl = url.parse(req.url, true);
        redirUrl.search = null;
        delete redirUrl.query.jwt;

        if (options.hook) {
            options.hook(claims, function(err) {
                if (err) return next();

                res.redirect(redirUrl.format());
            });
        }
        else {
            res.redirect(redirUrl.format());
        }

    };
}


module.exports = jwtsso;
