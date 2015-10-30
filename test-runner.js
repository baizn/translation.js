const fs = require( 'fs' ) ,
  jasmine = new (require( 'jasmine' ))();
jasmine.loadConfig( {
    "spec_dir" : "test" ,
    "spec_files" : [
      "**/*-spec.js"
    ] ,
    "helpers" : []
  }
);
jasmine.onComplete( passed => {
  const coveralls = require( 'coveralls' ),
    filepath=require( 'path' ).resolve( process.cwd() , 'coverage/lcov.info' );

  // 下面的代码全都来自 [karma-coveralls](https://github.com/caitp/karma-coveralls/blob/1.1.2/lib/index.js)
  coveralls.getBaseOptions( ( err , options )=> {
    options.filepath = ".";
    coveralls.convertLcovToCoveralls( fs.readFileSync( filepath , 'utf8' ).toString() , options , function ( err , postData ) {
      coveralls.sendToCoveralls( postData , ( err , response , body )=> {
        console.info( "uploading..." );
        send_to_coveralls( err , response , body );

        function send_to_coveralls( err , response , body ) {
          // check coveralls.io for issues, they send 200 even when down for maintenance :-\
          var isJSON;
          try {
            JSON.parse( body );
            isJSON = true;
          }
          catch ( e ) {
            isJSON = false;
          }
          if ( !response ) {
            // Unknown error, response object mysteriously undefined.
            response = {
              statusCode : 0
            };
          }
          if ( (response.statusCode >= 200 && response.statusCode < 300) && isJSON ) {
            // TODO: log success sending to coveralls.io
            console.info( "%d --- %s" , response.statusCode , success( body ) );
          } else {
            // TODO: log error sending to coveralls.io
            console.info( "%d --- %s" , response.statusCode , body );
          }
        }

        function success( body ) {
          if ( typeof body === "string" ) body = JSON.parse( body );
          if ( 'message' in body && 'url' in body ) {
            return body.message + " (" + body.url + ")";
          }
          return "OK";
        }
      } );
    } );
  } );
} );

jasmine.execute();
