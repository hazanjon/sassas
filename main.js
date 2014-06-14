var restify = require('restify');

function listResource(req, res, next) {
  res.send('list of resources here');
  next();
}

function createResource(req, res, next) {
  res.send(req.params.css);
  next();
}

function respond(req, res, next) {
  res.send('hello ' + req.params.css);
  next();
}

function postreq(req, res, next) {
  res.send('hello ' + req.params.id);
  next();
}

function root(req, res, next) {
  res.send('hi');
  next();
}

var server = restify.createServer();
server.use(restify.queryParser()).use(restify.bodyParser());

server.get('/', root);
//server.get('/resources', listResource);
server.get('/resources', createResource); //Should be POST but GET for testing
server.get('/resources/:id', respond);
server.post('/resources/:id', postreq);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});