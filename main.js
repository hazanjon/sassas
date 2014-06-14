var application_root = __dirname,
    path = require("path");
    
var express    = require('express');
var busboy  = require('connect-busboy');
var fs = require('fs');
var http = require('http');
var https = require('https');
var sass = require('node-sass');
var paypal_sdk = require('paypal-rest-sdk');
var mysql      = require('mysql');
var sys = require('sys')
var exec = require('child_process').exec;

var settings = require('./config.json');

paypal_sdk.configure(settings.paypal);
paypal_sdk.openid_connect.authorize_url({'scope': 'profile email'});

var connection = mysql.createConnection(settings.mysql);
connection.connect();

var users = [];

connection.query('SELECT *from users', function(err, rows) {
	users = users.concat(rows);
	console.log('users', users);
	
});

var helpers = {};

helpers.isInt = function(n){
	return /^-?[0-9]+$/.test(n.toString());
}

helpers.isUrlHttps = function(url){
	return /^https/.test(url.toString());
}

helpers.parseType = function(type){
	//@TODO: loop trouble setings.conversions instead
	switch(type){
		case 'sass':
			outtype = 'sass';
		break;
		case 'scss':
			outtype = 'scss';
		break;
		default:
		case 'css':
			outtype = 'css';
		break;
	}
	
	return outtype;
}

helpers.parseFileType = function(type, filename){
	//@TODO: Parse the filename
	return helpers.parseType(type);
}

helpers.convertType = function(id, to, from){
	console.log("eval `sass-convert --from "+from+" --to "+to+" "+settings.file_location+"/"+id+"."+from+" "+settings.file_location+"/"+id+"."+to+"`");
	exec("eval `sass-convert --from "+from+" --to "+to+" "+settings.file_location+"/"+id+"."+from+" "+settings.file_location+"/"+id+"."+to+"`", function (error, stdout, stderr) {
		//@TODO: record errors if they happen
	});
}

helpers.convertToOther = function(id, from){
	settings.conversions.forEach(function(type){
		if(type !== from)
			helpers.convertType(id, type, from);
	});
}

helpers.findUserByApiKey = function(apikey) {
	for (var i = 0, len = users.length; i < len; i++) {
		var user = users[i];
			if (user.apikey === apikey) {
				return user;
		}
	}
	return null;
}

helpers.findUserByEmail = function(email) {
	for (var i = 0, len = users.length; i < len; i++) {
		var user = users[i];
			if (user.email === email) {
				return user;
		}
	}
	return null;
}

helpers.createUserByEmail = function(newuser) {
	console.log('user',newuser);
	for (var i = 0, len = users.length; i < len; i++) {
		var user = users[i];
		if (user.email === newuser.email) {
			console.log('update', user.email, newuser.email);
			helpers.updateUser(newuser.email, newuser)
			return true;
		}
	}
	console.log('create');
	//helpers.insertUser(newuser);
	return true;
}

helpers.insertUser = function(user) {
	console.log('create user');
	var query = connection.query('INSERT INTO users SET ?', user, function(err, result) {
	  // Neat!
	});
	console.log(query.sql);
}

helpers.updateUser = function(email, user) {
	var query = connection.query('UPDATE users SET ? WHERE email = ?', [user, email], function(err, result) {
	  // Neat!
	});
	console.log(query.sql);
}

helpers.checkApiKey = function(req, res, next) {
	apikey = req.query.apikey || req.params.apikey;
	if (user = helpers.findUserByApiKey(apikey)) { 
		return next(); 
	}else{
		res.redirect('/api/unauthorized');
	}
}

helpers.createUser = function(firstname, lastname, email, access_token, refresh_token){
	var user = helpers.findUserByEmail(email);
	console.log('getuser', user, email);
	if(!user){
		var user = {email: email}
	}
	
	user.firstname = firstname;
	user.lastname = lastname;
	user.accesstoken = access_token;
	user.refreshtoken = refresh_token;
	user.apikey = 'apikey';
	
	helpers.createUserByEmail(user);
	//@TODO: insert into database
	return user;
}

function listResource(req, res) {
	res.send('list of resources here');
}

function createResource(req, res) {
	var id = 2;

	uploadResource(req, res, id);
}

function updateResource(req, res) {
	if(helpers.isInt(req.params.id)){
		//@TODO: check file exists
		var id = req.params.id;
	}else{
		//@TODO: Better Error
		res.send('Not a valid ID');
	}

	uploadResource(req, res, id);
}

function uploadResource(req, res, id) {
	
	var fstream;
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		var outtype = helpers.parseFileType(req.params.type, filename);
		
	    console.log("Uploading: " + filename);
	    
	    var newfilename = id+'.'+outtype;
	    fstream = fs.createWriteStream(__dirname + '/'+settings.file_location+'/' + newfilename);
	    file.pipe(fstream);
	    fstream.on('close', function () {
	    	helpers.convertToOther(id, outtype);
	    	//@TODO: return resource
	        res.send('Done');
	    });
	});
}

function getResource(req, res) {
	
	var outtype = helpers.parseType(req.params.type);
	
	if(helpers.isInt(req.params.id)){
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
			apikey = req.query.apikey || req.params.apikey;
			
			settings.conversions.forEach(function(conv) {
				links[conv] = {};
				links[conv].links = {};
				links[conv].links.raw = settings.url+'/resources/'+id+'/'+conv+'/raw?apikey='+apikey;
				links[conv].links.download = settings.url+'/resources/'+id+'/'+conv+'/download?apikey='+apikey;
				links[conv].status = 'Ready|Queued|Processing';
				
			});
			res.send(links);
		break;
	}
}

function inlineConvert(req, res) {
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		
	    console.log("Uploading: " + filename);
	    
		file.on('data', function(data) {
			var css = sass.renderSync({
			    data: data
			});
			res.contentType('text/css');
	      	res.send(css);
		});
	});
}

function inlineConvertUrl(req, res) {
	var url = req.query.url;
	
	if(!url)
		return;
	
	var protocol = http;
	if(helpers.isUrlHttps(url)){
		var protocol = https;
	}
	
	var request = protocol.get(url, function(response) {
	    var content = "";
	    response.on('data', function (chunk) {
	      content += chunk;
	    });

	    response.on('end', function(){
			var css = sass.renderSync({
			    data: content
			});
			res.contentType('text/css');
	      	res.send(css);
	    });
	});

}

function root(req, res) {
  res.send('hi');
}

function loginPage(req, res) {
  res.sendfile('htdocs/login.html');
}

function paypalAuthPage(req, res) {
	paypal_sdk.openid_connect.tokeninfo.create(req.query.code, function(error, tokeninfo){
		//console.log('token', tokeninfo);
		paypal_sdk.openid_connect.userinfo.get(tokeninfo.access_token, function(error, userinfo){
		 	if(typeof userinfo == "string")
				userinfo = JSON.parse(userinfo);
		 	//console.log('userinfo', userinfo);
		 	user = helpers.createUser(userinfo.given_name, userinfo.family_name, userinfo.email, tokeninfo.access_token, tokeninfo.refresh_token);
		 	res.send('Your API Key is: '+user.apikey);
		});
	});
}

var app        = express(); 				// define our app using express

var app = express();
//app.use(bodyParser());
app.use(busboy());
var router = express.Router();
app.use('/', router);

router.get('/', root);
router.get('/resources', helpers.checkApiKey, listResource);
router.post('/resources/:type?', helpers.checkApiKey, createResource);
router.get('/resources/:id/:type?/:format?', helpers.checkApiKey, getResource);
router.post('/resources/:id/:type?', helpers.checkApiKey, updateResource);
router.put('/resources/:id/:type?', helpers.checkApiKey, updateResource);
router.get('/inline', inlineConvertUrl);
router.post('/convert', inlineConvert);

router.get('/login', loginPage);
router.get('/paypalauth', paypalAuthPage);

router.get('/api/unauthorized', function(req, res){
  res.json({ message: "Authentication Error" })
});

app.use(express.static(__dirname + '/htdocs'));
// Launch server

app.listen(settings.listen);