const Baidu = require( '../lib/baidu' );

describe( '百度翻译' , ()=> {
  it( '能正常查询' , ( done )=> {
    new Baidu( { apiKey : 'Hs18iW3px3gQ6Yfy6Za0QGg4' } )
      .translate( { text : 'test' } )
      .then( res => {
        console.dir( res );
        done();
      } , err => {
        console.dir( err );
        done();
      } );
  } );
} );
