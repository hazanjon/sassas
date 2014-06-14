var application_root = __dirname,
    express = require("express"),
    path = require("path");//,
    //mongoose = require('mongoose');

function isInt(n){
	return /^-?[0-9]+$/.test(n.toString());
}

function listResource(req, res) {
  res.send('list of resources here');
}

function createResource(req, res) {
console.log(req);
  res.send(req.query.css);
}

function getResource(req, res) {
	
	var outtype = 'css';
	switch(req.params.type){
		case 'sass':
			outtype = 'sass';
		break;
		case 'scss':
			outtype = 'scss';
		break;
		case 'css':
			outtype = 'css';
		break;
	}
	
	if(isInt(req.params.id)){
		//@TODO: check file exists
		var id = req.params.id
		console.log('resources/'+req.params.id+'.'+outtype);
	}else{
		//@TODO: Better Error
		res.send('Not a valid ID');
		return
	}
	
	var format = req.params.format || 'json'; //@TODO: Implement header to request format, Also set to json default
	
	switch(format){
		case 'raw':
			res.contentType('text/css');
			res.sendfile('resources/'+id+'.'+outtype); //@TODO: filename
		break;
		case 'download':
			format = 'download';
			res.contentType('text/css');
			res.download('resources/'+id+'.'+outtype, 'yourfile'.outtype); //@TODO: filename
		break;
		default:
		case 'json':
		
			var links = {};
			
			settings.conversions.forEach(function(conv) {
				links[conv] = {};
				links[conv].links = {};
				links[conv].links.raw = settings.url+'/resources/'+id+'/'+conv+'/raw';
				links[conv].links.download = settings.url+'/resources/'+id+'/'+conv+'/download';
				links[conv].status = 'Ready|Queued|Processing';
				
			});
			res.send(links);
		break;
	}
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

var settings = {
	url: "http://assaas.hazan.me",
	listen: 8080,
	conversions: ['css','scss','sass']
};

var app = express();
app.use(bodyParser());
var router = express.Router();
app.use('/', router);

router.get('/', root);
//server.get('/resources', listResource);
router.get('/resources', createResource); //@TODO: Should be POST but GET for testing
router.get('/resources/:id/:type?/:format?', getResource);
//router.post('/resources/:id', postreq);

// Launch server

app.listen(8080);