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

    describe("res.jwtRequest()", function() {
        beforeEach(function() {
            this.app = express();
            this.app.use(puavo({
                authEndpoint: "https://authserver.opinsys.net/v3/remote_auth",
                sharedSecret: "secret",
                mountPoint: "http://myapp.example.com"
            }));
        });

        it("redirects to auth server when called from route", function(done){

            this.app.get("/foo", function(req, res) {
                res.jwtRequest();
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
                res.jwtRequest("/custom/path");
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
                res.jwtRequest("/custom/path?my=query");
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
            this.app.use(puavo({
                authEndpoint: "https://authserver.opinsys.net/v3/remote_auth",
                sharedSecret: "secret",
                mountPoint: "http://myapp.example.com"
            }));
            var self = this;
            this.app.get("/fooroute", function(req, res) {
                self.jwt = req.jwt;
                res.end("ok");
            });

        });

        it("is parsed to req.jwt", function(done){

            var token = jwt.encode({
                iat: now(),
                foo: "bar"
            }, "secret");

            var self = this;
            request(this.app)
            .get("/fooroute?jwt=" + token)
            .end(function(err, res) {
                if (err) throw err;
                assert(self.jwt);
                assert(self.jwt.claims);
                assert.equal(self.jwt.claims.foo, "bar");
                done();
            });

        });

        it("has an error if shared secret is invalid", function(done){

            var token = jwt.encode({
                foo: "bar",
                iat: now()
            }, "invalid");

            var self = this;
            request(this.app)
            .get("/fooroute?jwt=" + token)
            .end(function(err, res) {
                if (err) throw err;
                assert(self.jwt.error, "has jwt error");
                assert.equal(self.jwt.error.message, "Signature verification failed");
                assert(!self.jwt.claims);
                done();
            });

        });

        it("rejects too old tokens", function(done){

            var token = jwt.encode({
                foo: "bar",
                iat: now() - 300
            }, "secret");

            var self = this;
            request(this.app)
            .get("/fooroute?jwt=" + token)
            .end(function(err, res) {
                if (err) throw err;
                assert(self.jwt.error, "has jwt error");
                assert.equal(self.jwt.error.message, "token is too old");
                assert(!self.jwt.claims);
                done();
            });
        });

        it("rejects based on exp field", function(done){

            var token = jwt.encode({
                foo: "bar",
                iat: now() - 10,
                exp: now() - 5
            }, "secret");

            var self = this;
            request(this.app)
            .get("/fooroute?jwt=" + token)
            .end(function(err, res) {
                if (err) throw err;
                assert(self.jwt.error, "has jwt error");
                assert.equal(self.jwt.error.message, "token has expired");
                assert(!self.jwt.claims);
                done();
            });
        });

    });
});
