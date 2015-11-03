'use strict';

const YouDao = require( '../lib/youdao' ) ,
  youdao = new YouDao( { apiKey : '1361128838' , keyFrom : 'chrome' } ) ,
  nock = require( 'nock' );

nock.disableNetConnect();

describe( '有道翻译' , ()=> {
  it( '在初始化时若没有提供API Key及 key from则应该报错' , ()=> {
    let pass = 0;
    try {
      new YouDao();
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new YouDao( { apiKey : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new YouDao( { keyFrom : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new YouDao( { apiKey : 'xxx' , keyFrom : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    if ( pass !== 3 ) {
      fail( '没有API Key时应该报错' );
    }
  } );

  describe( '的 translate 方法' , ()=> {
    it( '在正常情况下会调用 transform 方法返回结果对象' , done => {
      const rawRes = {
        errorCode : 0 ,
        basic : {
          phonetic : '音标' ,
          explains : [ '解释1' , '解释2' ]
        } ,
        translation : [ '这里是翻译结果' ]
      };

      spyOn( youdao , 'transform' );

      nock( 'https://fanyi.youdao.com' )
        .get( '/openapi.do' )
        .query( true )
        .reply( 200 , rawRes );

      youdao
        .translate( { text : 'test' } )
        .then( result => {
          expect( youdao.transform ).toHaveBeenCalledWith( rawRes , { text : 'test' } );
          done();
        } , ()=> {
          fail( '错误的进入了 rejection 分支' );
          done();
        } );
    } );

    it( '在网络错误时应该被 reject' , done => {
      nock( 'https://fanyi.youdao.com' )
        .get( '/openapi.do' )
        .query( true )
        .replyWithError( 'some network error message' );

      youdao
        .translate( { text : 'test' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , ()=> {
          done();
        } );
    } );

    it( '在数据格式不正确时应该 resolve error' , ()=> {
      spyOn( YouDao , 'checkRes' ).and.returnValue( false );
      expect( youdao.transform( { errorCode : 3434 } , { text : 'xx' } ) ).toEqual( {
        text : 'xx' ,
        response : { errorCode : 3434 } ,
        error : '翻译服务器返回了错误的数据，请稍后重试'
      } );
    } );
  } );

  describe( '的 transform 方法' , ()=> {
    it( '在有道接口返回错误码时会 resolve error' , ()=> {
      const rawRes = {
        errorCode : 20
      } , result = youdao.transform( rawRes , { text : 'test' } );

      expect( result ).toEqual( {
        text : 'test' ,
        response : rawRes ,
        error : youdao.errMsg[ 20 ]
      } );
    } );

    it( '在有道接口返回正确格式数据时能正常转换' , ()=> {
      const rawRes = {
        errorCode : 0 ,
        basic : {
          phonetic : '音标' ,
          explains : [ '解释一' , '解释二' ]
        } ,
        translation : [ '翻译结果' ]
      } , result = youdao.transform( rawRes , { text : 'test' } );

      expect( result ).toEqual( {
        text : 'test' ,
        response : rawRes ,
        phonetic : '音标' ,
        detailed : rawRes.basic.explains ,
        result : rawRes.translation.join( '\n' ) ,
        linkToResult : 'http://fanyi.youdao.com/translate?i=test'
      } );
    } );
  } );

  describe( '的 detect 方法' , ()=> {
    it( '若查询对象没有提供源语种，则直接 reject null' , done => {
      youdao
        .detect( { text : 'xx' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , err => {
          expect( err ).toBeNull();
          done();
        } );
    } );

    it( '若查询对象里有支持的 from，则直接 resolve' , done => {
      youdao
        .detect( { text : 'xx' , from : 'ja' } )
        .then( lan => {
          expect( lan ).toBe( 'jap' );
          done();
        } , ()=> {
          fail( '错误的进入了 reject 分支' );
          done();
        } );
    } );

    it( '若查询对象里有 from 但不被支持，则 reject null' , done => {
      youdao
        .detect( { text : 'x' , from : 'i' } )
        .then( () => {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , err => {
          expect( err ).toBeNull();
          done();
        } );
    } );
  } );

  it( '的静态方法 checkRes' , ()=> {
    expect( YouDao.checkRes( '不是 json' ) ).toBe( false );
    expect( YouDao.checkRes( { x : '没有errorCode' } ) ).toBe( false );
    expect( YouDao.checkRes( { x : '既没有 translation，也没有 explains' , errorCode : 0 } ) ).toBe( false );
    expect( YouDao.checkRes( { x : '没有 explains' , errorCode : 0 , translation : [ '结果' ] } ) ).toBe( true );
    expect( YouDao.checkRes( {
      x : '没有 translation' ,
      errorCode : 0 ,
      basic : { explains : [ '结果' ] }
    } ) ).toBe( true );
  } );

  it( '的 audio 方法总是会调用 detect 获取自己的语种' , done => {
    spyOn( youdao , 'detect' ).and.returnValue( Promise.resolve( 'wtf' ) );

    const q = { text : 'test' , from : 'ja' };
    youdao.audio( q ).then( url => {
      expect( youdao.detect ).toHaveBeenCalledWith( q );
      expect( url ).toBe( 'http://tts.youdao.com/fanyivoice?keyfrom=fanyi%2Eweb%2Eindex&le=wtf&word=test' );
      done();
    } );
  } );
} );

