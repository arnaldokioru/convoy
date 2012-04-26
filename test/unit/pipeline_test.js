/**
 * @module pipeline_test
 * @copyright 2012 Charles Jolley
 */

var should   = require('should');
var h  = require('../helpers');
var lib = h.lib;
var FS  = require('fs');
var PATH = require('path');

RegExp.escape = function(text) {
    return text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

function testmodules(path) {
  var data = FS.readFileSync(path, 'utf8'),
      idx, len = arguments.length;

  var lines = data.split('\n'), regex;

  function processLine(line) {
    line.should.match(regex);
  }

  function filterLines(moduleName) {
    return function(line) { 
      return line.indexOf('"'+moduleName+'"')>=0; 
    };
  }  
  
  for(idx=1;idx<len;idx++) {
    var moduleName = RegExp.escape(arguments[idx]);
    regex = new RegExp('define\\(.*\\"' + moduleName +
      '\\".+\\"\\(function\\(.+@module\\s+' + moduleName);

    var filteredLines = lines.filter(filterLines(arguments[idx]));

    filteredLines.length.should.not.equal(0, arguments[idx]);
    filteredLines.forEach(processLine);
  }

}

function testcss(path) {
  var data = FS.readFileSync(path, 'utf8');
  var regex = [], idx, len = arguments.length;
  for(idx=1;idx<len;idx++) {
    regex = new RegExp('@module\\s+' + RegExp.escape(arguments[idx]));
    data.should.match(regex);
  }
}

describe('[unit] pipeline', function() {

  var inst, buildir;

  beforeEach(function() {
    inst = new lib.Pipeline({
      'app.js': {
        type: 'javascript',
        main: h.fixture('sample_app')
      },

      'app.css': {
        type: 'css',
        main: h.fixture('sample_app/styles')
      },

      'assets': {
        type: 'copy',
        root: h.fixture('sample_app/assets')
      }
    });

    buildir = h.tmpfile('public') ;
  });

  it('should build javascript', function(done) {
    var path = PATH.resolve(buildir, 'app.js');

    h.mkdirSync_p(buildir);
    inst.writeFile('app.js', buildir, function(err) {
      if (err) return done(err);
      PATH.existsSync(path).should.equal(true);
      testmodules(path,
        'jquery/lib/jquery',
        'ember/view',
        'ember/core',
        'ember/model',
        'ember/application',
        'sample_app/app/main',
        'sample_app/app/core',
        'sample_app/app/views/main_view',
        'sample_app/app/templates/main_template',
        'sample_app/app/models/person');
      done();
    });
  });

  it("should build css" , function(done) {
    var path    = PATH.resolve(buildir, 'app.css');

    h.mkdirSync_p(buildir);
    inst.writeFile('app.css', buildir, function(err) {
      if (err) return done(err);
      PATH.existsSync(path).should.equal(true);
      testcss(path,
        'bootstrap/styles/index',
        'bootstrap/styles/addon',
        'bootstrap/styles/reset/index',
        'bootstrap/styles/reset/body',
        'bootstrap/styles/reset/type',
        'sample_app/styles/global',
        'sample_app/styles/models',
        'sample_app/styles/index');
      done();
    });
  });

  it("should copy individual assets", function(done) {
    var path    = PATH.resolve(buildir, 'assets/index.html');
    inst.writeFile('assets/index.html', buildir, function(err) {
      if (err) return done(err);
      PATH.existsSync(path).should.equal(true, path);
      done();
    });
  });

  it("should copy all assets when directory is passed", function(done) {
    var path = PATH.resolve(buildir, 'assets');
    inst.writeFile('assets', buildir, function(err) {
      if (err) return done(err);
      ['index.html', 'images/a.png', 'images/b.png'].forEach(function(file) {
        PATH.existsSync(PATH.resolve(path, file)).should.equal(true, file);
      });
      done();
    });
  });

});
