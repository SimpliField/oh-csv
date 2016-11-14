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
function getStreamBuffer(stream, cb) {
  var buf = new Buffer('');
  stream.on('readable', function () {
    var chunk;
    do {
      chunk = stream.read();
      if(chunk) {
        buf = Buffer.concat([buf, chunk]);
      }
    } while(chunk !== null);
  });
  stream.on('end', function () {
    cb(buf);
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

    it('should work for csv with csv config with an empty first column', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            ['', 'test1', 'another test1'],
            ['', 'test2', 'another test2'],
            ['', 'test3', 'another test3'],
            ['', 'test4', 'another test4']
          ]);
          done();
        });
        parser.write(',test1,another test1\r\n');
        parser.write(',test2,another test2\r\n');
        parser.write(',test3,another test3\r\n');
        parser.write(',test4,another test4\r\n');
        parser.end();
    });

    it('should work for csv with csv config with an empty last column', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', ''],
            [2, 'test2', ''],
            [3, 'test3', ''],
            [4, 'test4', '']
          ]);
          done();
        });
        parser.write('1,test1,\r\n');
        parser.write('2,test2,\r\n');
        parser.write('3,test3,\r\n');
        parser.write('4,test4,\r\n');
        parser.end();
    });

    it('should work for csv with csv config with only 2 empty columns', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            ['', ''],
            ['', ''],
            ['', ''],
            ['', '']
          ]);
          done();
        });
        parser.write(',\r\n');
        parser.write(',\r\n');
        parser.write(',\r\n');
        parser.write(',\r\n');
        parser.end();
    });

    it('should work for csv with one field per line', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            ['another test1'],
            ['another test2'],
            ['another test3'],
            ['another test4']
          ]);
          done();
        });
        parser.write('another test1\r\n');
        parser.write('another test2\r\n');
        parser.write('another test3\r\n');
        parser.write('another test4\r\n');
        parser.end();
    });

    it('should work for csv with one field per line and no new line at the end', function(done) {
        var parser = new csv.Parser(csv.csvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            ['another test1'],
            ['another test2'],
            ['another test3'],
            ['another test4']
          ]);
          done();
        });
        parser.write('another test1\r\n');
        parser.write('another test2\r\n');
        parser.write('another test3\r\n');
        parser.write('another test4');
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

    it('should work for tsv with tsv config and complexer content', function(done) {
        var parser = new csv.Parser(csv.tsvOpts);
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'multi\r\nline\r\ntest1'],
            [2, 'test2', 'multi\r\nline\r\ntest1'],
            [3, 'test3', 'multi\r\nline\r\ntest1'],
            [4, 'test4', 'multi\r\nline\r\ntest1']
          ]);
          done();
        });
        parser.write('1\ttest1\t"multi\r\nline\r\ntest1"\r\n');
        parser.write('2\ttest2\t"multi\r\nline\r\ntest1"\n');
        parser.write('3\ttest3\t"multi\r\nline\r\ntest1"\r\n');
        parser.write('4\ttest4\t"multi\r\nline\r\ntest1"\n');
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

    it('should work with multichars config', function(done) {
        var parser = new csv.Parser({
          linesep: 'aaaa',
          sep: 'bbbb',
          esc: 'cccc',
          quot: 'dddd'
        });
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [
            [1, 'test1', 'anobbther test1'],
            [2, 'test2', 'anobbbbther test2'],
            [3, 'test3', 'anobbther test3'],
            [4, 'test4', 'anobbbbther test4']
          ]);
          done();
        });
        parser.write('1bbbbtest1bbbbanobbther test1aaaa');
        parser.write('2bbbbtest2bbbbanoccccbbbbther test2aaaa');
        parser.write('3bbbbtest3bbbbanobbther test3aaaa');
        parser.write('4bbbbtest4bbbbanoccccbbbbther test4aaaa');
        parser.end();
    });

    it('should work for csv when fields are given', function(done) {
        var parser = new csv.Parser({
          fields: ['id', 'label', 'description']
        });
        getStreamObjs(parser, function(objs) {
          assert.deepEqual(objs, [{
            id: 1,
            label: 'test1',
            description: 'another test1'
          },{
            id: 2,
            label: 'test2',
            description: 'another test2'
          },{
            id: 3,
            label: 'test3',
            description: 'another test3'
          },{
            id: 4,
            label: 'test4',
            description: 'another test4'
          }]);
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

    it('should work for csv with RFC csv config and quotes but no new line at the end', function(done) {
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
        parser.write('4,"test4","an ""other"" test4"');
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

    it('should fail when a quoted field is closed with another quote than the one that opened it', function(done) {
      var parser = new csv.Parser({
        quote:['"','\'']
      });
      parser.on('error', function(err) {
        assert.equal(err.message, 'Unclosed field detected.');
        done();
      });
      parser.write('1,"test1","an ""other"" test1\r\n');
      parser.write('2,"test2\',an other test2\r\n');
      parser.write('3,test3,an other test3\r\n');
      parser.write('4,test4,an other test4\r\n');
      parser.end();
    });

  });

  it('should work when new wasn\'t used', function() {
    assert.doesNotThrow(function() {
      csv.Parser() instanceof csv.Parser;
    })
  });

  it('should fail with no linesep is given', function() {
    assert.throws(function() {
      new csv.Parser({
        linesep:[]
      });
    })
  });

  it('should fail with no field sep is given', function() {
    assert.throws(function() {
      new csv.Parser({
        sep:[]
      });
    })
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

      it('with an empty first column', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            ',test1,another test1\r\n' +
            ',test2,another test2\r\n' +
            ',test3,another test3\r\n' +
            ',test4,another test4\r\n'
          );
          done();
        });
        encoder.write(['', 'test1', 'another test1']);
        encoder.write(['', 'test2', 'another test2']);
        encoder.write(['', 'test3', 'another test3']);
        encoder.write(['', 'test4', 'another test4']);
        encoder.end();
      });

      it('with an empty last column', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,test1,\r\n' +
            '2,test2,\r\n' +
            '3,test3,\r\n' +
            '4,test4,\r\n'
          );
          done();
        });
        encoder.write([1, 'test1', '']);
        encoder.write([2, 'test2', '']);
        encoder.write([3, 'test3', '']);
        encoder.write([4, 'test4', '']);
        encoder.end();
      });

      it('with only 2 empty columns', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            ',\r\n' +
            ',\r\n' +
            ',\r\n' +
            ',\r\n'
          );
          done();
        });
        encoder.write(['', '']);
        encoder.write(['', '']);
        encoder.write(['', '']);
        encoder.write(['', '']);
        encoder.end();
      });

      it('only one field per line', function(done) {
        var encoder = new csv.Encoder(csv.csvOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            'another test1\r\n' +
            'another test2\r\n' +
            'another test3\r\n' +
            'another test4\r\n'
          );
          done();
        });
        encoder.write(['another test1']);
        encoder.write(['another test2']);
        encoder.write(['another test3']);
        encoder.write(['another test4']);
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

      it('in object mode', function(done) {
        var encoder = new csv.Encoder({
          fields: ['id', 'label', 'description']
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,te\\,st1,ano\\,ther \\,test1\r\n' +
            '2,te\\,st2,ano\\,ther \\,test2\r\n' +
            '3,te\\,st3,ano\\,ther \\,test3\r\n' +
            '4,te\\,st4,ano\\,ther \\,test4\r\n'
          );
          done();
        });
        encoder.write({
          id: 1,
          label: 'te,st1',
          description: 'ano,ther ,test1'
        });
        encoder.write({
          id: 2,
          label: 'te,st2',
          description: 'ano,ther ,test2'
        });
        encoder.write({
          id: 3,
          label: 'te,st3',
          description: 'ano,ther ,test3'
        });
        encoder.write({
          id: 4,
          label: 'te,st4',
          description: 'ano,ther ,test4'
        });
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
            '1\t"te\tst1\n"\t"\r\nano\tther\r \ttest1"\r\n' +
            '2\t"te\tst2\n"\t"\r\nano\tther\r \ttest2"\r\n' +
            '3\t"te\tst3\n"\t"\r\nano\tther\r \ttest3"\r\n' +
            '4\t"te\tst4\n"\t"\r\nano\tther\r \ttest4"\r\n'
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

      it('with fields containing quotes', function(done) {
        var encoder = new csv.Encoder(csv.csvRFCOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,tu,"""peux""",pas,"te""st"\r\n' +
            '2,tu,"""peux""",pas,"te""st"\r\n' +
            '3,tu,"""peux""",pas,"te""st"\r\n' +
            '4,tu,"""peux""",pas,"te""st"\r\n'
          );
          done();
        });
        encoder.write([1, 'tu', '"peux"', 'pas', 'te"st']);
        encoder.write([2, 'tu', '"peux"', 'pas', 'te"st']);
        encoder.write([3, 'tu', '"peux"', 'pas', 'te"st']);
        encoder.write([4, 'tu', '"peux"', 'pas', 'te"st']);
        encoder.end();
      });

      it('with fields with new lines', function(done) {
        var encoder = new csv.Encoder(csv.csvRFCOpts);
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,tu,"pe\r\nux","\r\npas\r\n",test\r\n' +
            '2,tu,"pe\r\nux","\r\npas\r\n",test\r\n' +
            '3,tu,"pe\r\nux","\r\npas\r\n",test\r\n' +
            '4,tu,"pe\r\nux","\r\npas\r\n",test\r\n'
          );
          done();
        });
        encoder.write([1, 'tu', 'pe\r\nux', '\r\npas\r\n', 'test']);
        encoder.write([2, 'tu', 'pe\r\nux', '\r\npas\r\n', 'test']);
        encoder.write([3, 'tu', 'pe\r\nux', '\r\npas\r\n', 'test']);
        encoder.write([4, 'tu', 'pe\r\nux', '\r\npas\r\n', 'test']);
        encoder.end();
      });

    });

    describe('should work with custom config', function() {

      it('introducing quotes and unix new lines', function(done) {
        var encoder = new csv.Encoder({
          quote: '"',
          linesep: '\n'
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1,"\\"tu",peux,pas,"test\\""\n' +
            '2,"\\"tu",peux,pas,"test\\""\n' +
            '3,"\\"tu",peux,pas,"test\\""\n' +
            '4,"\\"tu",peux,pas,"test\\""\n'
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
          quote: '~',
          sep: 'é',
          esc: '€',
          toEsc: ['€', '~', 'é', 'à'],
          linesep: 'à'
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '2é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '3é~t€~u~é~p€éux~é~p€€s~é~t€àst~à' +
            '4é~t€~u~é~p€éux~é~p€€s~é~t€àst~à'
          );
          done();
        });
        encoder.write([1, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([2, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([3, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.write([4, 't~u', 'péux', 'p€s', 'tàst']);
        encoder.end();
      });

      it('introducing exotic chars', function(done) {
        var encoder = new csv.Encoder({
          quote: '~',
          sep: 'é',
          esc: '€',
          linesep: 'à'
        });
        getStreamText(encoder, function(text) {
          assert.equal(text,
            '1é~t€~u~é~péux~é~p€€s~é~tàst~à' +
            '2é~t€~u~é~péux~é~p€€s~é~tàst~à' +
            '3é~t€~u~é~péux~é~p€€s~é~tàst~à' +
            '4é~t€~u~é~péux~é~p€€s~é~tàst~à'
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

  it('should work when new wasn\'t used', function() {
    assert.doesNotThrow(function() {
      csv.Encoder() instanceof csv.Encoder;
    })
  });

  it('should fail with objects when no fields were given', function() {
    var encoder = new csv.Encoder();
    assert.throws(function() {
      encoder.write({
        id:1,
        label: 'test'
      });
    })
  });

});

describe('csv excel wrapper', function() {

  it('should work as expected', function(done) {
    var input = new Stream.PassThrough();
    var output = csv.wrapForExcel(input);
    getStreamBuffer(output, function(buf) {
      assert.deepEqual(buf,
        Buffer.concat([
          new Buffer([0xFF, 0xFE]),
          new Buffer(
            '1,test1,another test1\r\n' +
            '2,test2,another test2\r\n',
            'ucs2'
          )
        ])
      );
      done();
    });
    input.write('1,test1,another test1\r\n');
    input.write('2,test2,another test2\r\n');
    input.end();
  });

});

