"use strict";
// A standard worker.
var salsify = require('salsify').configure(function(done){
    salsify.key = 'myAwsKey';
    salsify.secret = 'myAwsSecret';
    done();
});

new salsify.Worker()
    .on('job', function(data, done){
        done(null, true);
    })
    .listen('myqueue');