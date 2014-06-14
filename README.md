## Automatic Style Sheets As A Service

Built at BristolHack 2014.

The aim of ASSAAS is to provide remote conversion capabilities for SCSS and SASS files.

Multiple different services are provided:

1. REST API - Allows uploading of CSS, SASS & SCSS which are then converted into the other formats, each time a new version is uploaded the other linked files are updated.
2. Inline Conversion - `GET /inline?url=<encoded url to scss>` This can be used to inline insert SCSS files into web pages, it is advised that you only use this for development sites as this is not fast.
3. File Conversion - `POST /convert` This will convert a file posted to the endpoint