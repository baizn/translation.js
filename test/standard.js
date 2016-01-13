/**
 * 对一个 API 对象进行标准检测。
 * 里面注释掉的部分需要各个 API 自行测试。
 */

module.exports = ( Class )=> {
  const className = Class.name;
  describe( className + 'API' , ()=> {

    it( '必须有一个 resolve 的静态函数' , ()=> {
      expect( typeof Class.resolve ).toBe( 'function' );
      expect( typeof Class.resolve( 'en' ) ).toBe( 'string' );
      expect( Class.resolve( 'no this lang' , true ) ).toBeNull();
      expect( Class.resolve( 'no this lang' ) ).toBeNull();
      expect( Class.resolve( 'no this lang' , true ) ).toBeNull();
    } );

    describe( '的实例' , ()=> {
      const c = new Class( {
        apiKey : 'x' ,
        keyFrom : 'y'
      } );

      it( '需要有一个 name 属性' , ()=> {
        expect( typeof c.name ).toBe( 'string' );
      } );

      it( '需要有一个 link 属性' , ()=> {
        expect( typeof c.link ).toBe( 'string' );
      } );

      //describe( '的 translate 方法' , ()=> {
      //  it( '正常情况下回返回一个查询结果对象' );
      //  it( '若网络错误则返回 SuperAgent 错误对象' );
      //} );

      describe( '的 detect 方法' , ()=> {

        it( '必须是一个函数' , ()=> {
          expect( typeof c.detect ).toBe( 'function' );
        } );

        describe( '如果查询对象有 from 属性' , ()=> {

          it( '若支持 from 指定的标准语种则返回字符串' , ( done )=> {
            c.detect( {
              text : 'test' ,
              from : 'en'
            } ).then( ( lang )=> {
              expect( lang ).toBe( 'en' );
              done();
            } , ()=> {
              fail( '错误的进入了 reject 分支' );
              done();
            } );
          } );

          it( '若不支持 from 指定的标准语种则返回 null' , ( done )=> {
            c.detect( {
              text : 'test' ,
              from : 'no this lang'
            } ).then( ()=> {
              fail( '错误的进入了 resolve 分支' );
              done();
            } , ( e )=> {
              expect( e ).toBeNull();
              done();
            } );
          } );
        } );

        //describe( '若查询对象没有 form 属性' , ()=> {
        //  it( '若支持此语种则返回标准语种字符串' );
        //  it( '若不支持此语种则返回 null' );
        //  it( '若检测语种时发生网络错误则返回 SuperAgent 的错误对象' );
        //} );
      } );

      describe( '的 audio 方法' , ()=> {

        //it( '若支持则返回语音地址字符串' );

        it( '不支持朗读或者不支持此查询对象的语种会 reject null' , ( done )=> {
          c.audio( { text : 'test' , from : 'no this lang' } ).then( ()=> {
            fail( '错误的进入了 resolve 分支' );
            done();
          } , ( e )=> {
            expect( e ).toBeNull();
            done();
          } );
        } );

      } );
    } );
  } );
};
