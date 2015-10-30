const jasmine = new (require( 'jasmine' ))();
jasmine.loadConfig( {
    "spec_dir" : "test" ,
    "spec_files" : [
      "**/*-spec.js"
    ] ,
    "helpers" : []
  }
);
jasmine.execute();
