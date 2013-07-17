/* global describe, it */
var assert = require("assert");
var url = require("url");
var express = require("express");
var request = require("supertest");

var app = express();

var authServerUrl = "https://kehitys.opinsys.net/v3/remote_auth";

app.get("/foo", function(req, res) {
    res.redirect(authServerUrl);
});

app.get("/bar", function(req, res) {
    res.json(401, {});
});

describe("connect-puavo", function(){

    it("redirects to auth server when without credentials", function(done){
        request(app)
        .get("/foo")
        .end(function(err, res) {
            if (err) throw err;

            assert.equal(
                res.headers.location,
                authServerUrl
            );
            done();

        });
    });

    it("responds 401 for bad hmac", function(done){
        request(app)
        .get("/bar")
        .expect(401)
        .end(done);
    });
});



