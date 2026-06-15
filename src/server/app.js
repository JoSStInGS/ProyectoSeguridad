/*jshint node:true*/
'use strict';

var express = require('express');
var app = express();
// app.disable('x-powered-by');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var port = process.env.PORT || 8001;
var four0four = require('./utils/404')();

var environment = process.env.NODE_ENV;

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
// Middleware que genera token CSRF y lo envía en cookie al cliente
var crypto = require('crypto');
app.use(function(req, res, next) {
    // Si no existe token CSRF, se genera uno nuevo
    if (!req.cookies.csrfToken) {
        var token = crypto.randomBytes(32).toString('hex');
        res.cookie('csrfToken', token, { path: '/' });
        req.csrfToken = token;
    } else {
        req.csrfToken = req.cookies.csrfToken;
    }
    next();
});
app.use(logger('dev'));

// app.use(function(req, res, next) {
//     res.setHeader('Content-Security-Policy', 'script-src \'self\' ajax.googleapis.com');
//     return next();
// });

app.use('/api', require('./routes'));

console.log('About to crank up node');
console.log('PORT=' + port);
console.log('NODE_ENV=' + environment);

switch (environment){
    case 'build':
        console.log('** BUILD **');
        app.use(express.static('./build/'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./build/index.html'));
        break;
    default:
        console.log('** DEV **');
        app.use(express.static('./src/client/'));
        app.use(express.static('./'));
        app.use(express.static('./tmp'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./src/client/index.html'));
        break;
}

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
        '\n__dirname = ' + __dirname  +
        '\nprocess.cwd = ' + process.cwd());
});
