var assert = require('assert');
var Stream = require('readable-stream');
var csv = require('../src');

// Tools
function getStreamObjs(stream, cb) {
  var objs = [];
  stream.on('readable', function () {
    var obj;
    do {
      obj = stream.read();
      if(obj !== null) {
        objs.push(obj);
      }
    } while(obj !== null);
  });
  stream.on('end', function () {
    cb(objs);
  });
}
function getStreamText(stream, cb) {
  var text = '';
  stream.on('readable', function () {
    var chunk;
    do {
      chunk = stream.read();
      if(chunk !== null) {
        text += chunk.toString();
      }
    } while(chunk !== null);
  });
  stream.on('end', function () {
    cb(text);
  });
}

describe('csv parser', function() {

  describe('in array mode', function() {

    it('should work for csv with single seps config', function(done) {
        var parser = new csv.Parser({
          esc: '\\',
          sep: ',',
          linesep: '\n'
        });
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'te,st1', 'anot,her test1'],
            [2, 'te,st2', 'anot,her test2'],
            [3, 'te,st3', 'anot,her test3'],
            [4, 'te,st4', 'anot,her test4']
          ]);
          done();
        });
        parser.write('1,te\\,st1,anot\\,her test1\n');
        parser.write('2,te\\,st2,anot\\,her test2\n');
        parser.write('3,te\\,st3,anot\\,her test3\n');
        parser.write('4,te\\,st4,anot\\,her test4\n');
        parser.end();
    });

    it('should work for csv with csv config', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'another test1'],
            [2, 'test2', 'another test2'],
            [3, 'test3', 'another test3'],
            [4, 'test4', 'another test4']
          ]);
          done();
        });
        parser.write('1,test1,another test1\r\n');
        parser.write('2,test2,another test2\r\n');
        parser.write('3,test3,another test3\r\n');
        parser.write('4,test4,another test4\r\n');
        parser.end();
    });

    it('should work for tsv with tsv config', function(done) {
        var parser = new csv.Parser(csv.tsvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'another test1'],
            [2, 'test2', 'another test2'],
            [3, 'test3', 'another test3'],
            [4, 'test4', 'another test4']
          ]);
          done();
        });
        parser.write('1\ttest1\tanother test1\r\n');
        parser.write('2\ttest2\tanother test2\n');
        parser.write('3\ttest3\tanother test3\r\n');
        parser.write('4\ttest4\tanother test4\n');
        parser.end();
    });

    it('should work for csv with RFC csv config', function(done) {
        var parser = new csv.Parser(csv.csvRFCOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'another test1'],
            [2, 'test2', 'another test2'],
            [3, 'test3', 'another test3'],
            [4, 'test4', 'another test4']
          ]);
          done();
        });
        parser.write('1,test1,another test1\r\n');
        parser.write('2,test2,another test2\r\n');
        parser.write('3,test3,another test3\r\n');
        parser.write('4,test4,another test4\r\n');
        parser.end();
    });

    it('should work for csv with csv config and quotes', function(done) {
        var parser = new csv.Parser(csv.csvQuotOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'an "other" test1'],
            [2, 'test2', 'an "other" test2'],
            [3, 'test3', 'an "other" test3'],
            [4, 'test4', 'an "other" test4']
          ]);
          done();
        });
        parser.write('1,"test1","an \\"other\\" test1"\r\n');
        parser.write('2,"test2","an \\"other\\" test2"\r\n');
        parser.write('3,"test3","an \\"other\\" test3"\r\n');
        parser.write('4,"test4","an \\"other\\" test4"\r\n');
        parser.end();
    });

    it('should work for csv with RFC csv config and quotes', function(done) {
        var parser = new csv.Parser(csv.csvRFCOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'an "other" test1'],
            [2, 'test2', 'an "other" test2'],
            [3, 'test3', 'an "other" test3'],
            [4, 'test4', 'an "other" test4']
          ]);
          done();
        });
        parser.write('1,"test1","an ""other"" test1"\r\n');
        parser.write('2,"test2","an ""other"" test2"\r\n');
        parser.write('3,"test3","an ""other"" test3"\r\n');
        parser.write('4,"test4","an ""other"" test4"\r\n');
        parser.end();
    });

    it('should fail when a quoted field isn\'t closed', function(done) {
      var parser = new csv.Parser(csv.csvRFCOpts);
      parser.on('error', function(err) {
        assert.equal(err.message, 'Unclosed field detected.');
        done();
      });
      parser.write('1,"test1","an ""other"" test1\r\n');
      parser.write('2,test2,an other test2\r\n');
      parser.write('3,test3,an other test3\r\n');
      parser.write('4,test4,an other test4\r\n');
      parser.end();
    });

  });

});

describe('csv encoder', function() {

  describe('with arrays', function() {

    describe('should work with csv config', function() {

      it('and simple input', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,test1,another test1\r\n' +
            '2,test2,another test2\r\n' +
            '3,test3,another test3\r\n' +
            '4,test4,another test4\r\n'
          );
          done();
        });
        encoder.write([1, 'test1', 'another test1']);
        encoder.write([2, 'test2', 'another test2']);
        encoder.write([3, 'test3', 'another test3']);
        encoder.write([4, 'test4', 'another test4']);
        encoder.end();
      });

      it('and input needing escape', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,te\\,st1,ano\\,ther \\,test1\r\n' +
            '2,te\\,st2,ano\\,ther \\,test2\r\n' +
            '3,te\\,st3,ano\\,ther \\,test3\r\n' +
            '4,te\\,st4,ano\\,ther \\,test4\r\n'
          );
          done();
        });
        encoder.write([1, 'te,st1', 'ano,ther ,test1']);
        encoder.write([2, 'te,st2', 'ano,ther ,test2']);
        encoder.write([3, 'te,st3', 'ano,ther ,test3']);
        encoder.write([4, 'te,st4', 'ano,ther ,test4']);
        encoder.end();
      });

    });

    describe('should work with tsv config', function() {

      it('and simple input', function(done) {

        var encoder = new csv.Encoder(csv.tsvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1\ttest1\tanother test1\r\n' +
            '2\ttest2\tanother test2\r\n' +
            '3\ttest3\tanother test3\r\n' +
            '4\ttest4\tanother test4\r\n'
          );
          done();
        });
        encoder.write([1, 'test1', 'another test1']);
        encoder.write([2, 'test2', 'another test2']);
        encoder.write([3, 'test3', 'another test3']);
        encoder.write([4, 'test4', 'another test4']);
        encoder.end();
      });

      it('and input needing escape', function(done) {
        var encoder = new csv.Encoder(csv.tsvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1\tte\\\tst1\\\n\t\\\r\nano\\\tther\\\r \\\ttest1\r\n' +
            '2\tte\\\tst2\\\n\t\\\r\nano\\\tther\\\r \\\ttest2\r\n' +
            '3\tte\\\tst3\\\n\t\\\r\nano\\\tther\\\r \\\ttest3\r\n' +
            '4\tte\\\tst4\\\n\t\\\r\nano\\\tther\\\r \\\ttest4\r\n'
          );
          done();
        });
        encoder.write([1, 'te\tst1\n', '\r\nano\tther\r \ttest1']);
        encoder.write([2, 'te\tst2\n', '\r\nano\tther\r \ttest2']);
        encoder.write([3, 'te\tst3\n', '\r\nano\tther\r \ttest3']);
        encoder.write([4, 'te\tst4\n', '\r\nano\tther\r \ttest4']);
        encoder.end();
      });

    });

    describe('should work with the CSV RFC config', function() {

      it('with this input', function(done) {
        var encoder = new csv.Encoder(csv.csvRFCOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '"1","tu","""peux""","pas","test"\r\n' +
            '"2","tu","""peux""","pas","test"\r\n' +
            '"3","tu","""peux""","pas","test"\r\n' +
            '"4","tu","""peux""","pas","test"\r\n'
          );
          done();
        });
        encoder.write([1, 'tu', '"peux"', 'pas', 'test']);
        encoder.write([2, 'tu', '"peux"', 'pas', 'test']);
        encoder.write([3, 'tu', '"peux"', 'pas', 'test']);
        encoder.write([4, 'tu', '"peux"', 'pas', 'test']);
        encoder.end();
      });

    });

    describe('should work with custom config', function() {

      it('introducing quotes and unix new lines', function(done) {
        var encoder = new csv.Encoder({
          quotes: '"',
          linesep: '\n'
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '"1","\\"tu","peux","pas","test\\""\n' +
            '"2","\\"tu","peux","pas","test\\""\n' +
            '"3","\\"tu","peux","pas","test\\""\n' +
            '"4","\\"tu","peux","pas","test\\""\n' 
          );
          done();
        });
        encoder.write([1, '"tu', 'peux', 'pas', 'test"']);
        encoder.write([2, '"tu', 'peux', 'pas', 'test"']);
        encoder.write([3, '"tu', 'peux', 'pas', 'test"']);
        encoder.write([4, '"tu', 'peux', 'pas', 'test"']);
        encoder.end();
      });

      it('introducing exotic chars', function(done) {
        var encoder = new csv.Encoder({
          quotes: '~',
          sep: 'é',
          esc: '€',
          linesep: 'à'
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '~1~é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '~2~é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '~3~é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '~4~é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' 
          );
          done();
        });
        encoder.write([1, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([2, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([3, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([4, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.end();
      });

    });

  });

});
