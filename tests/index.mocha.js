var assert = require('assert');
var Stream = require('readable-stream');
var csv = require('../src');

// Tools
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

  it('should work', function() {
    assert(false);
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

  });

});
