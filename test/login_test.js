/* global describe, it, beforeEach */
var assert = require("assert");
var url = require("url");
var express = require("express");
var request = require("supertest");
var jwt = require("jwt-simple");

var puavo = require("../index");


function now() {
    return Math.round(Date.now() / 1000);
}

describe("connect-puavo", function(){

    describe("res.requestJwt()", function() {
        beforeEach(function() {
            this.app = express();
            this.app.use(express.cookieParser());
            this.app.use(express.session({ secret: "secret" }));
            this.app.use(puavo({
                authEndpoint: "https://authserver.opinsys.net/v3/remote_auth",
                sharedSecret: "secret",
                mountPoint: "http://myapp.example.com"
            }));
        });

        it("redirects to auth server when called from route", function(done){

            this.app.get("/foo", function(req, res) {
                res.requestJwt();
            });

            request(this.app)
            .get("/foo")
            .end(function(err, res) {
                if (err) throw err;
                assert(res.headers.location, "got redirect");
                var redirUrl = url.parse(res.headers.location, true);
                assert.equal(redirUrl.host, "authserver.opinsys.net");
                assert.equal(redirUrl.pathname, "/v3/remote_auth");
                assert.equal(redirUrl.query.return_to, "http://myapp.example.com/foo");
                done();

            });
        });

        it("can set custom path", function(done){
            this.app.get("/foo", function(req, res) {
                res.requestJwt("/custom/path");
            });

            request(this.app)
            .get("/foo")
            .end(function(err, res) {
                if (err) throw err;
                assert(res.headers.location, "got redirect");
                var redirUrl = url.parse(res.headers.location, true);
                assert.equal(redirUrl.query.return_to, "http://myapp.example.com/custom/path");
                done();
            });
        });

        it("can set custom path with query string", function(done){
            this.app.get("/foo", function(req, res) {
                res.requestJwt("/custom/path?my=query");
            });

            request(this.app)
            .get("/foo")
            .end(function(err, res) {
                if (err) throw err;
                assert(res.headers.location, "got redirect");
                var redirUrl = url.parse(res.headers.location, true);
                assert.equal(redirUrl.query.return_to, "http://myapp.example.com/custom/path?my=query");
                done();
            });
        });


    });

    describe("jwt", function() {
        beforeEach(function() {
            this.app = express();
            this.app.use(express.cookieParser());
            this.app.use(express.session({ secret: "secret" }));
            this.app.use(puavo({
                authEndpoint: "https://authserver.opinsys.net/v3/remote_auth",
                sharedSecret: "secret",
                mountPoint: "http://myapp.example.com"
            }));

            this.requestWithToken = function(token, cb) {
                request(this.app)
                .get("/fooroute?foo=bar&jwt=" + token)
                .end(cb);
            }.bind(this);
        });

        it("sets jwt token to session object", function(done){
            this.app.get("/fooroute", function(req, res) {
                res.end("ok");
                assert(req.session.jwt, "jwt is on session object");
                assert.equal(req.session.jwt.foo, "bar");
                assert.equal(req.query.foo, "bar", "persist query values");
                done();
            });

            var token = jwt.encode({
                iat: now(),
                foo: "bar"
            }, "secret");

            this.requestWithToken(token, function(err, res) {
                if (err) done(err);
                assert(res.headers.location, "got redirect");
                request(this.app)
                .get(res.headers.location)
                .set("cookie", res.headers["set-cookie"])
                .end(function(err) {
                    if (err) done(err);
                });
            }.bind(this));
        });

        it("emits error for invalid shared secret", function(done){
            this.app.use(function(err, req, res, next) {
                assert(err);
                assert.equal(err.message, "Signature verification failed");
                done();
            });

            var token = jwt.encode({
                iat: now(),
                foo: "bar"
            }, "invalid");

            this.requestWithToken(token, function(err) {
                if (err) done(err);
            });
        });

        it("emits error for too old token", function(done){
            this.app.use(function(err, req, res, next) {
                assert(err);
                assert.equal(err.message, "token is too old");
                done();
            });

            var token = jwt.encode({
                iat: now() - 300,
                foo: "bar"
            }, "secret");

            this.requestWithToken(token, function(err) {
                if (err) done(err);
            });
        });

        it("emits error for expired tokens", function(done){
            this.app.use(function(err, req, res, next) {
                assert(err);
                assert.equal(err.message, "token has expired");
                done();
            });

            var token = jwt.encode({
                iat: now() - 40,
                exp: now() - 3,
                foo: "bar"
            }, "secret");

            this.requestWithToken(token, function(err) {
                if (err) done(err);
            });
        });


    });

});
