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
var hat = require('hat');
var settings = require('./config.json');

paypal_sdk.configure(settings.paypal);
paypal_sdk.openid_connect.authorize_url({'scope': 'profile email'});

var connection = mysql.createConnection(settings.mysql);
connection.connect();

var users = [];

connection.query('SELECT * from users', function(err, rows) {
	users = users.concat(rows);
	//console.log('users', users);
	
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
	outtype = '';
	switch(type){
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
	
	return outtype;
}

/*helpers.parseFileType = function(type, filename){
	//@TODO: Parse the filename
	type =  helpers.parseType(type);
	
	if(!type){
		var details = helpers.breakdownFilename(filename);
		if(details)
			type = details.ext;
	}
	
	if(!type){
		//@TODO: Set Default
	}
	
	return type;
}*/

helpers.convertType = function(id, to, from){
	if(to === 'css'){
		//@TODO: replace with libsass here
		//console.log("eval `sass "+settings.file_location+"/"+id+"/"+id+"."+from+" "+settings.file_location+"/"+id+"/"+id+"."+to+"`");
		exec("eval `sass "+settings.file_location+"/"+id+"/"+id+"."+from+" "+settings.file_location+"/"+id+"/"+id+"."+to+"`", function (error, stdout, stderr) {
			//@TODO: record errors if they happen
			console.log(error);
		});
	}else{	
		//console.log("eval `sass-convert --from "+from+" --to "+to+" "+settings.file_location+"/"+id+"/"+id+"."+from+" "+settings.file_location+"/"+id+"/"+id+"."+to+"`");
		exec("eval `sass-convert --from "+from+" --to "+to+" "+settings.file_location+"/"+id+"/"+id+"."+from+" "+settings.file_location+"/"+id+"/"+id+"."+to+"`", function (error, stdout, stderr) {
			//@TODO: record errors if they happen
			console.log(error);
		});
	}
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
	//console.log('user',newuser);
	for (var i = 0, len = users.length; i < len; i++) {
		var user = users[i];
		if (user.email === newuser.email) {
			//console.log('update', user.email, newuser.email);
			helpers.updateUser(newuser.email, newuser);
			users[i] = newuser;
			return true;
		}
	}
	//console.log('create');
	helpers.insertUser(newuser);
	users.push(newuser);
	return true;
}

helpers.insertUser = function(user) {
	//console.log('create user');
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
    
	//console.log('key check',req.query.apikey);
	apikey = req.query.apikey || req.params.apikey;
	if (req.user = helpers.findUserByApiKey(apikey)) { 
		return next(); 
	}else{
		errors.noperm(res);
		return;
	}
}

helpers.createUser = function(firstname, lastname, email, access_token, refresh_token){
	var user = helpers.findUserByEmail(email);
	//console.log('getuser', user, email);
	if(!user){
		var user = {email: email, apikey: hat()}
	}
	
	user.firstname = firstname;
	user.lastname = lastname;
	user.accesstoken = access_token;
	user.refreshtoken = refresh_token;
	
	helpers.createUserByEmail(user);
	//@TODO: insert into database
	return user;
}

helpers.breakdownFilename = function(filename){
	var pattern = /^(.*)\.(sass|scss|css)$/i;
	var match = filename.match(pattern);
	
	var details = {
		"name": match[1],
		"ext": match[2]
	};
	
	console.log(filename, match);  // null
	return details;
}

var errors = {};

errors.noperm = function(res){
	res.json({ message: "Authentication Error" })
}
errors.filenotavaiable = function(res){
	res.json({ message: "The requested file is not currently avaiable, it may currently be being processed, please try again" })
}
errors.noobject = function(res, object){
	res.json({ message: "The requested "+object+" does not exist" })
}
errors.badparam = function(res, name, value){
	res.json({ message: "Invalid "+name+" parameter passed: "+value })
}

function listResource(req, res) {
	
	connection.query('SELECT * FROM resources WHERE user_id = ?', req.user.id, function(err, rows) {
		
		var output = [];
		
		if(rows[0]){
			rows.forEach(function(row){
				
				var resource = resourceLinks(req, row.id);
				resource.id = row.id;
				resource.name = row.name;
				
				output.push(resource);	
			});
		}
		
		res.json(output);
	});
}

function createResource(req, res) {
	
	var resource = {
		user_id: req.user.id
	}
	
	var query = connection.query('INSERT INTO resources SET ?', resource, function(err, result) {
	  	//console.log('err', err);
	  	resource.id = result.insertId;
		uploadResource(req, res, resource);
	});
}

function updateResource(req, res) {
	//console.log('updateResource');
	if(helpers.isInt(req.params.id)){
		//@TODO: check file exists
		var id = req.params.id;
	}else{
		errors.badparam(res, 'ID', req.params.id);
		return;
	}
	
	connection.query('SELECT * FROM resources WHERE id = ?', id, function(err, rows) {
		//console.log('resource', rows[0]);
		if(rows[0]){
			var resource = rows[0];
		}else{
			errors.noobject(res, 'Resource');
			return;
		}
		
		if(resource.user_id == req.user.id){
			uploadResource(req, res, rows[0]);
		}else{
			errors.noperm(res);
			return;
		}
	});

}

function uploadResource(req, res, resources) {
	
	var fstream;
	req.pipe(req.busboy);
	
	/*req.busboy.on('field', function (fieldname, val, valTruncated, keyTruncated) {
        req.params.body[fieldname] = val;
        console.log(fieldname, value);
    });*/
	req.busboy.on('file', function (fieldname, file, filename) {
	    var details = helpers.breakdownFilename(filename);
		
		var paramtype =  helpers.parseType(req.params.type); //Setting Param :type overrides the extension
		if(paramtype)
			details.ext = paramtype;
		//@TODO: add name to database
	    //console.log("Uploading: " + filename);
	    var newfilename = resources.id+'.'+details.ext;
		fs.mkdirSync(__dirname + '/'+settings.file_location + '/' + resources.id);
	    fstream = fs.createWriteStream(__dirname + '/'+settings.file_location + '/' + resources.id + '/' + newfilename);
	    file.pipe(fstream);
	    fstream.on('close', function () {
	    	helpers.convertToOther(resources.id, details.ext);
	    });
	});
	
	req.busboy.on('finish', function () {
		res.json(resourceLinks(req, resources.id));
	});
}

function getResource(req, res) {
	
	var outtype = helpers.parseType(req.params.type);
	//console.log('out',outtype);
	
	if(!helpers.isInt(req.params.id)){
		errors.badparam(res, 'ID', req.params.id);
		return
	}
	
	var format = req.params.format || 'json'; //@TODO: Implement header to request format, Also set to json default
	
	var location = 'resources/'+req.params.id+'/'+req.params.id+'.'+outtype;
	switch(format){
		case 'raw':
			if(!outtype)
				outtype = 'css';
			
			if (!fs.existsSync(location)) {
			    //File doesnt exist, wait a short span to see if a conversion is finishing
			    errors.filenotavaiable(res);
			    return;
			}
			
			res.contentType('text/css');
			res.sendfile(location); //@TODO: filename
		break;
		case 'download':
			if(!outtype)
				outtype = 'css';
			
			if (!fs.existsSync(location)) {
			    //File doesnt exist, wait a short span to see if a conversion is finishing
			    errors.filenotavaiable(res);
			    return;
			}
			res.contentType('text/css');
			res.download(location, 'yourfile'.outtype); //@TODO: filename
		break;
		default:
		case 'json':
			res.json(resourceLinks(req, req.params.id, outtype));
		break;
	}
}

function resourceLinks(req, id, types){
	
	if(!types){
		types = settings.conversions;
	}else if(typeof types === "string"){
		types = [types];	
	}
	var links = {};
	console.log(types);
	types.forEach(function(conv) {
		links[conv] = {};
		links[conv].links = {};
		links[conv].links.raw = settings.url+'/api/resources/'+id+'/'+conv+'/raw?apikey='+req.query.apikey;
		links[conv].links.download = settings.url+'/api/resources/'+id+'/'+conv+'/download?apikey='+req.query.apikey;
		//links[conv].status = 'Ready|Queued|Processing';
		
	});
	
	return links;
}

function inlineConvert(req, res) {
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		
	    //console.log("Uploading: " + filename);
	    
		file.on('data', function(data) {
			//console.log('data recived', data);
			var css = sass.render({
			    data: data,
				success: function(css){
					res.contentType('text/css');
			      	res.send(css);
	    			//console.log("Sent: " + css);
				}
			});
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
	
	//@TODO: Handle bad urls / bad files
	var request = protocol.get(url, function(response) {
	    var content = "";
	    response.on('data', function (chunk) {
	      content += chunk;
	    });

	    response.on('end', function(){
			var css = sass.render({
			    data: content,
				success: function(css){
					res.contentType('text/css');
			      	res.send(css);
				}
			});
	    });
	});

}

function root(req, res) {
  res.sendfile('htdocs/index.html');
}

function apidocs(req, res) {
  res.sendfile('htdocs/docs.html');
}

function paypalAuthPage(req, res) {
	paypal_sdk.openid_connect.tokeninfo.create(req.query.code, function(error, tokeninfo){
		//console.log('token', tokeninfo);
		paypal_sdk.openid_connect.userinfo.get(tokeninfo.access_token, function(error, userinfo){
		 	if(typeof userinfo == "string")
				userinfo = JSON.parse(userinfo);
		 	//console.log('userinfo', userinfo);
		 	user = helpers.createUser(userinfo.given_name, userinfo.family_name, userinfo.email, tokeninfo.access_token, tokeninfo.refresh_token);
	 		res.render('apikey', { title: 'Your API Key', apikey: user.apikey });
		});
	});
}

var app        = express(); 				// define our app using express

var app = express();
//app.use(bodyParser());
app.use(busboy());
var router = express.Router();
app.use('/', router);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

router.get('/', root);
router.get('/api/resources', helpers.checkApiKey, listResource);
router.post('/api/resources', helpers.checkApiKey, createResource);//@TODO: Allow passing of type, will need regex
router.get('/api/resources/:id/:type?/:format?', helpers.checkApiKey, getResource);
router.post('/api/resources/:id/:type?', helpers.checkApiKey, updateResource);
router.put('/api/resources/:id/:type?', helpers.checkApiKey, updateResource);
router.get('/api/inline', inlineConvertUrl);
router.post('/api/convert', inlineConvert);

router.get('/paypalauth', paypalAuthPage);
router.get('/docs', apidocs);

router.get('/unauthorized', function(req, res){
});

app.use(express.static(__dirname + '/htdocs'));
// Launch server

app.listen(settings.listen);