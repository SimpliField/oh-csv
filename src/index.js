var Stream = require('readable-stream');
var util = require('util');

// Predefined configuration
var csvOpts = {
  sep: [','],
  esc: ['\\'],
  quotes: ['"'],
  linesep: ['\n', '\r', '\r\n'],
  charsEncoding: 'ascii'
};
var tsvOpts = {
  sep: ['\t'],
  esc: ['\\'],
  quotes: ['"'],
  linesep: ['\n', '\r', '\r\n'],
  charsEncoding: 'ascii'
};

// CSV object
var csv = {
  Parser: CSVParser,
  Encoder: CSVEncoder,
  csvOpts: csvOpts,
  tsvOpts: tsvOpts
};

// Options integrity
function checkOptions(options) {
  options.sep = options.sep || csvOpts.sep;
  options.esc = options.esc || '' === options.esc ? options.esc : csvOpts.esc;
  options.quotes = options.quotes || '' === options.quotes ? options.quotes : csvOpts.quotes;
  options.linesep = options.linesep || csvOpts.linesep;
  options.charsEncoding = options.charsEncoding || csvOpts.charsEncoding;
  return options;
}


// Parser
function CSVParser(options) {

  // Ensure new were used
  if(!(this instanceof CSVEncoder)) {
    return new CSVEncoder(options);
  }

  // Parent constructor
  Stream.Transform.call(this, {
    objectMode: true
  });

  // Setting objectMode separately
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;

}

// Inherit of transform stream
util.inherits(CSVParser, Stream.Transform);




// Encoder
function CSVEncoder(options) {

  // Ensure new were used
  if(!(this instanceof CSVEncoder)) {
    return new CSVEncoder(options);
  }

  // Parent constructor
  Stream.Transform.call(this, {
    objectMode: true
  });

  // Setting objectMode separately
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  // Keep the options
  this.options = checkOptions(options);

}

// Inherit of transform stream
util.inherits(CSVEncoder, Stream.Transform);

// Implement _transform underlying function
CSVEncoder.prototype._transform = function csvEncoderTransform(row, encoding, cb) {
  var chunk;
  // Flattening objects
  if(!(row instanceof Array)) {
    if(!(this.options.fields && this.options.fields.length)) {
      throw new Error('Cannot flat the given object since no field were defined.');
    }
    row = this.options.fields.map(function(field){
      return row[field];
    });
  }
  // Creating the chunk
  if(null !== encoding) {
    this.push(new Buffer(row.join(this.options.sep[0]) + this.options.linesep[0], encoding));
  } else {
    row = row.reduce(function(buffers, buf) {
      if(buffers.length) {
        buffers.push(new Buffer(path.sep[0], this.optionscharsEncoding));
      }
      buffers.push(buf);
    }, []);
    this.push(Buffer.concat(row, row.length));
  }
  cb();
};

module.exports = csv;
