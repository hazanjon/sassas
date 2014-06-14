var application_root = __dirname,
    express = require("express"),
    path = require("path");//,
    //mongoose = require('mongoose');

function sendFile(filename){
	var outStream = require('fs').createWriteStream(filename);

	// Add this to ensure that the out.txt's file descriptor is closed in case of error.
	response.on('error', function(err) {
		outStream.end();
	});

	// Pipe the input to the output, which writes the file.
	response.pipe(outStream);
}

function listResource(req, res) {
  res.send('list of resources here');
}

function createResource(req, res) {
console.log(req);
  res.send(req.query.css);
}

function getResource(req, res) {
  res.send('resource');
}

function postreq(req, res) {
  res.send('hello ' + req.params.id);
}

function root(req, res) {
  res.send('hi');
}

var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');

// Database

//mongoose.connect('mongodb://localhost/ecomm_database');

// Config

var app = express();
app.use(bodyParser());
var router = express.Router();
app.use('/', router);
//server.use(express.static(path.join(application_root, "htdocs")));
//server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

router.get('/', root);
//server.get('/resources', listResource);
router.get('/resources', createResource); //Should be POST but GET for testing
router.get('/resources/:id', getResource);
//router.post('/resources/:id', postreq);

// Launch server

app.listen(8080);