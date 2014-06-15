FORMAT: 1A
HOST: http://sassas.uk

# SASSAS

## API Key
All the Resource API's require you to pass an apikey as a GET parameter. You signup for a key on the main page.

```
GET /api/resources?apikey=1234567890
```

# Resources

## Resource List [/api/resources]

+ Model

    + Parameters
    
        + apikey (string) ... Users API Key.
        
    + Body

            [
                {
                    id: 1,
                    name: 'main',
                    css: {
                        links: {
                            raw: "http://sassas.uk/api/resources/1/css/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/1/css/download?apikey=<API Key>"
                        }
                    },
                    scss: {
                        links: {
                            raw: "http://sassas.uk/api/resources/1/scss/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/1/scss/download?apikey=<API Key>"
                        }
                    },
                    sass: {
                        links: {
                            raw: "http://sassas.uk/api/resources/1/sass/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/1/sass/download?apikey=<API Key>"
                        }
                    }
                },
                    id: 2,
                    name: 'main',
                    css: {
                        links: {
                            raw: "http://sassas.uk/api/resources/2/css/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/2/css/download?apikey=<API Key>"
                        }
                    },
                    scss: {
                        links: {
                            raw: "http://sassas.uk/api/resources/2/scss/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/2/scss/download?apikey=<API Key>"
                        }
                    },
                    sass: {
                        links: {
                            raw: "http://sassas.uk/api/resources/2/sass/raw?apikey=<API Key>",
                            download: "http://sassas.uk/api/resources/2/sass/download?apikey=<API Key>"
                        }
                    }
                }
            ]

### Get Resources [GET]
Get a list of your resources.

+ Response 200
    
    [Resource List][]

### Create New Resource [POST]
Create a new Resource

+ Request

    + Headers

            Content-Type: application/x-www-form-urlencoded

    + Body
    
            {
                file: 'main.css'
            }
            
+ Response 200

    + Headers

            Content-Type: application/json

    + Body

            {
                id: 1,
                name: 'main',
                css: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/css/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/css/download?apikey=<API Key>"
                    }
                },
                scss: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/scss/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/scss/download?apikey=<API Key>"
                    }
                },
                sass: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/sass/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/sass/download?apikey=<API Key>"
                    }
                }
            }

## Resource [/api/resources/{id}]
Resource Details

+ Parameters

    + apikey (string) ... Users API Key.
    + id (required, integer, `1234`) ... The resource ID

+ Model

    + Headers

    + Body

            {
                id: 1,
                name: 'main',
                css: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/css/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/css/download?apikey=<API Key>"
                    }
                },
                scss: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/scss/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/scss/download?apikey=<API Key>"
                    }
                },
                sass: {
                    links: {
                        raw: "http://sassas.uk/api/resources/1/sass/raw?apikey=<API Key>",
                        download: "http://sassas.uk/api/resources/1/sass/download?apikey=<API Key>"
                    }
                }
            }

### Get Resource [GET]
Get a single resource.

+ Response 200

    [Resource][]

### Update a Resource [PUT]
Update a single Resource

+ Request

    + Headers

            Content-Type: application/x-www-form-urlencoded

    + Body
    
            {
                file: 'main.css'
            }

+ Response 200

    [Resource][]


# Group Tools

## Inline Conversion [/api/inline?url=<url>]

        
### Inline Conversion [GET]
Pass an encoded url to a SCSS file as a parameter, the file will be retreived and returned as a compiled CSS file.

## Direct Conversion [/api/convert]

### Direct Conversion [POST]
Send a SCSS file to this endpoint and you will be returned compiled CSS.

