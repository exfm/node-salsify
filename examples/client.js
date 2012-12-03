"use strict";

var salsify = require('salsify').configure(function(done){
    salsify.key = 'myAwsKey';
    salsify.secret = 'myAwsSecret';
    done();
});

salsify.delay('myqueue', {'usernames': ['lucas']});