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
            .configure(function(){});
    });

    it("should work with a simple in memory backend", function(done){
        var s = new salsify.Salsify()
            .use("memory")
            .configure(function(){}),
            worker = new salsify.Worker(s)
                .on('job', function(data, d){
                    d(null, "test 2");
                })
                .on('success', function(result){
                    assert(result);
                    done();
                })
                .listen('test');

        s.delay('test', {'ello': 'orld'});
    });

    it("should retry if an error is thrown", function(done){
        var s = new salsify.Salsify()
            .use("memory")
            .configure(function(){}),
            worker = new salsify.Worker(s)
                .on('job', function(data, d){
                    throw new Error("Bahhhhhhhh");
                })
                .on('success', function(result){
                    done(assert.fail());
                })
                .on('error', function(err){
                    assert(err.message === 'Bahhhhhhhh');
                    done();
                })
                .listen('test');

        s.delay('test', {'Hello': 'World'});
    });
});
