"use strict";

var cluster = require('cluster'),
    nconf = require('nconf'),
    os = require('os');

nconf.argv().env().use("memory").defaults({'workers': os.cpus().length});

if(cluster.isMaster){
    for(var i = 0; i < Number(nconf.get('workers')); i++){
        cluster.fork();
    }
}
else{
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
}