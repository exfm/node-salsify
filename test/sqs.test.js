"use strict";

var assert = require('assert'),
    salsify = require('../'),
    fs = require('fs'),
    config = JSON.parse(fs.readFileSync(__dirname + '/auth.json', 'utf-8'));

describe('SQS', function(){
    // it("should fire a ready event after configured", function(done){
    //     new salsify.Salsify()
    //         .on('ready', function(){
    //             assert(this.backend.type === "sqs");
    //             done();
    //         })
    //         .use("sqs")
    //         .configure(function(){
    //             this.key = config.key;
    //             this.secret = config.secret;
    //         });
    // });

    it("should work with a simple delay / pull", function(done){
        var s = new salsify.Salsify()
            .use("sqs")
            .configure(function(){
                this.key = config.key;
                this.secret = config.secret;
            }),
            worker = new salsify.Worker(s)
                .on('job', function(data, d){
                    d(null, "test 2");
                })
                .on('success', function(result){
                    // assert(result);
                    done();
                })
                .listen('sqstest');

        s.delay('sqstest', {'ello': 'orld'});
    });
});
