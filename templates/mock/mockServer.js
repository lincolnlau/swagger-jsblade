'use strict';
/**************************************************************************************************
 * This sample demonstrates the most simplistic usage of Swagger-Express-Middleware-With-Chance.
 * It simply creates a new Express Application and adds all of the Swagger middleware.
 * Default port use 8000 which you can change it at anytime.
 **************************************************************************************************/

// Set the DEBUG environment variable to enable debug output
process.env.DEBUG = 'swagger:middleware';

var express = require('express');
var middleware = require('swagger-express-middleware-with-chance');
var path = require('path');
var app = express();


middleware(path.join(__dirname, 'swagger.json'), app, function(err, middleware) {
  
  app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    //middleware.parseRequest(),
    // middleware.validateRequest(),
    middleware.mock()
  );

  app.listen(8000, function() {
    console.log('The mock server is now running at http://localhost:8000');
  });
});
