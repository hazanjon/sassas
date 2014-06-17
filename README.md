## Syntactically Awesome Style Sheets Automated Service

Built at BristolHack 2014.

Better known as 'Syntactically Awesome Style Sheets Automated Service' is a tool designed to help developers with the trials of working with SASS & SCSS.

Multiple different services are provided:

### REST API
The REST API allows you to upload any CSS, SASS or SCSS file, where it will then be converted into the other formats and made available for you to download. These files will be stored for you to retreive or update at a later time

```
GET /api/resources?apikey=<Your API Key> //Get a List of your resources
POST /api/resources?apikey=<Your API Key> //Create a new resource
GET /api/resources/:id?apikey=<Your API Key> //Get one of your resources
POST /api/resources/:id?apikey=<Your API Key> //Update a resource
PUT /api/resources/:id?apikey=<Your API Key> //Update a resource
```

###Inline Conversion

Embed your SCSS & SASS files directly into your website without needing to compile them!

Please only use this on development sites as it can be slow.

`<link href="http://sassas.uk/api/inline?url=<URL>" rel="stylesheet">`

### Direct Conversion
POST an SCSS file to /api/convert and you will be returned the compiled CSS in the response body.

### Grunt Plugin
If you want to use Direct Conversion as part of your Grunt workflow you can use the [grunt-sassas](https://www.npmjs.org/package/grunt-sassas) plugin.

`npm install grunt-sassas`