var Stream = require('readable-stream');
var util = require('util');
var escapeRegExpComponent = require('escape-regexp-component');

// Predefined configuration
var csvOpts = {
  sep: [','],
  esc: ['\\'],
  quotes: [''],
  linesep: ['\r\n', '\n', '\r'],
  charsEncoding: 'ascii'
};
var tsvOpts = {
  sep: ['\t'],
  esc: ['\\'],
  quotes: [''],
  linesep: ['\r\n', '\n', '\r'],
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
  // Required
  if(options.sep && 'string' === typeof options.sep) {
    options.sep = [options.sep];
  } else {
    options.sep = options.sep || csvOpts.sep;
  }
  if(!options.sep.length) {
    throw Error('The option.sep argument is required.')
  }
  if(options.linesep && 'string' === typeof options.linesep) {
    options.linesep = [options.linesep];
  } else {
    options.linesep = options.linesep || csvOpts.linesep;
  }
  if(!options.linesep.length) {
    throw Error('The option.sep argument is required.')
  }
  options.charsEncoding = options.charsEncoding || csvOpts.charsEncoding;
  // Optionnal
  if('string' === typeof options.esc) {
    options.esc = [options.esc];
  } else {
    options.esc = options.esc || csvOpts.esc;
  }
  if(options.quotes && 'string' === typeof options.quotes) {
    options.quotes = [options.quotes];
  } else {
    options.quotes = options.quotes || [];
  }
  options.charsToEscape = (
    options.charsToEscape ||
    options.quotes.concat(options.sep).concat(options.linesep)
  ).filter(function(s) { return s; });
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

  // Build the escape search regular expression
  this._escRegExp = new RegExp(
    '(' + this.options.charsToEscape.map(escapeRegExpComponent).join('|') + ')',
    'gm'
  );

}

// Inherit of transform stream
util.inherits(CSVEncoder, Stream.Transform);

// Implement _transform underlying function
CSVEncoder.prototype._transform = function csvEncoderTransform(row, encoding, cb) {
  var chunk;
  var _self = this;
  // Flattening objects
  if(!(row instanceof Array)) {
    if(!(_self.options.fields && _self.options.fields.length)) {
      throw new Error('Cannot flat the given object since no fields were defined.');
    }
    row = _self.options.fields.map(function(field){
      return row[field];
    });
  }
  // Creating the chunk
  _self.push(new Buffer(
    row.map(function(field) {
      return (_self.options.quotes[0] || '') + (field+'').replace(
        _self._escRegExp,
        _self.options.esc[0] + '$1'
      ) + (_self.options.quotes[0] || '');
    }).join(_self.options.sep[0]) + _self.options.linesep[0],
    encoding
  ));
  cb();
};

module.exports = csv;
