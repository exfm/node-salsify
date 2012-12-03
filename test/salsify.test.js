"use strict";

var assert = require('assert'),
    salsify = require('../'),
    fs = require('fs'),
    config = JSON.parse(fs.readFileSync(__dirname + '/auth.json'));

describe('Salsify', function(){
    it("should fire a ready event after configured", function(done){
        new salsify.Salsify()
            .on('ready', function(){
                assert(this.backend.type === "memory");
                done();
            })
            .use("memory")
            .configure(function(){
                this.key = config.key;
                this.secret = config.secret;
            });
    });

    it("should work with a simple in memory backend", function(done){
        var s = new salsify.Salsify()
            .on('ready', function(){
                assert(this.backend.type === "memory");
            })
            .use("memory")
            .configure(function(){
                this.key = config.key;
                this.secret = config.secret;
            }),
            worker = new salsify.Worker(s)
                .on('job', function(data, d){
                    d(null, true);
                })
                .on('success', function(result){
                    assert(result);
                    done();
                })
                .on('error', function(err){
                    done(err);
                })
                .listen('test');

        s.delay('test', {'ello': 'orld'});
    });
});
