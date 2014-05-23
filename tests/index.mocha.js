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

    it('should work with simple input and csv config', function(done) {
      var encoder = new csv.Encoder(csv.csvOpts);
      getStreamText(encoder, function(text) {
        assert.equal(text,
          '1,test1,another test1\n' +
          '2,test2,another test2\n' +
          '3,test3,another test3\n' +
          '4,test4,another test4\n'
        );
        done();
      })
      encoder.write([1, 'test1', 'another test1']);
      encoder.write([2, 'test2', 'another test2']);
      encoder.write([3, 'test3', 'another test3']);
      encoder.write([4, 'test4', 'another test4']);
      encoder.end();
    });

    it('should work with simple input and tsv config', function(done) {
      var encoder = new csv.Encoder(csv.tsvOpts);
      getStreamText(encoder, function(text) {
        assert.equal(text,
          '1\ttest1\tanother test1\n' +
          '2\ttest2\tanother test2\n' +
          '3\ttest3\tanother test3\n' +
          '4\ttest4\tanother test4\n'
        );
        done();
      })
      encoder.write([1, 'test1', 'another test1']);
      encoder.write([2, 'test2', 'another test2']);
      encoder.write([3, 'test3', 'another test3']);
      encoder.write([4, 'test4', 'another test4']);
      encoder.end();
    });

  });

});
