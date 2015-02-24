var Stream = require('readable-stream');
var util = require('util');
var escapeRegExpComponent = require('escape-regexp-component');

// Predefined configuration
var csvOpts = {
  sep: [','],
  linesep: ['\r\n', '\n', '\r'],
  esc: ['\\']
};
var csvQuotOpts = {
  sep: [','],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  toQuote: [',', '\r\n', '\n', '\r'],
  esc: ['\\'],
  toEsc: ['"']
};
var tsvOpts = {
  sep: ['\t'],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  toQuote: [',', '\r\n', '\n', '\r'],
  esc: ['"'],
  toEsc: ['"']
};
var tsvQuotOpts = {
  sep: ['\t'],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  toQuote: ['\t', '\r\n', '\n', '\r'],
  esc: ['"'],
  toEsc: ['"']
};
var csvRFCOpts = {
  sep: [','],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  toQuote: [',', '\r\n', '\n', '\r', '"'],
  esc: ['"'],
  toEsc: ['"']
};

// CSV object
var csv = {
  Parser: CSVParser,
  Encoder: CSVEncoder,
  wrapForExcel: csvWrapForExcel,
  csvOpts: csvOpts,
  csvQuotOpts: csvQuotOpts,
  tsvOpts: tsvOpts,
  csvRFCOpts: csvRFCOpts
};

// Options integrity
function checkOptions(options) {
  options = options || {};
  // Separators (required)
  if(options.sep && 'string' === typeof options.sep) {
    options.sep = [options.sep];
  } else {
    options.sep = options.sep || csvOpts.sep;
  }
  if(!options.sep.length) {
    throw new Error('The option.sep argument is required.');
  }
  if(options.linesep && 'string' === typeof options.linesep) {
    options.linesep = [options.linesep];
  } else {
    options.linesep = options.linesep || csvOpts.linesep;
  }
  if(!options.linesep.length) {
    throw new Error('The option.sep argument is required.');
  }
  // Quotes (optionnal)
  if(options.quote && 'string' === typeof options.quote) {
    options.quote = [options.quote];
  } else {
    options.quote = options.quote || [];
  }
  if('string' === typeof options.toQuote) {
    options.toQuote = [options.toQuote];
  }
  if('undefined' === typeof options.toQuote && options.quote.length) {
    options.toQuote = options.sep.concat(options.linesep).concat(options.quote)
      .concat(options.esc);
  } else {
    options.toQuote = options.toQuote || [];
  }
  // Escape (optionnal)
  if('string' === typeof options.esc) {
    options.esc = [options.esc];
  } else {
    options.esc = options.esc || csvOpts.esc;
  }
  if('string' === typeof options.toEsc) {
    options.toEsc = [options.toEsc];
  }
  if('undefined' === typeof options.toEsc && options.esc.length) {
    options.toEsc = options.quote.concat(options.esc);
    if(!options.quote.length) {
      options.toEsc = options.toEsc.concat(options.sep).concat(options.linesep);
    }
  } else {
    options.toEsc = options.toEsc || [];
  }
  return options;
}


// Parser
function CSVParser(options) {

  // Ensure new were used
  if(!(this instanceof CSVParser)) {
    return new CSVParser(options);
  }

  // Parent constructor
  Stream.Transform.call(this, {
    objectMode: true
  });

  // Setting objectMode separately
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;

  // Keep the options
  this.options = checkOptions(options);

  // Parsing states
  this._parsingState = CSVParser.STATE_FIELD;
  this._lnSep = '';
  this._discardLn = false;
  this._fSep = '';
  this._discardFSep = false;
  this._escState = '';
  this._escChars = '';
  this._discardEsc = false;
  this._startQuotState = '';
  this._discardStartQuote = false;
  this._endQuotState = '';
  this._discardEndQuot = false;
  // Row/fields states
  this._currentRow = [];
  this._currentField = '';
  // Parser state
  this.lineNum = 1;
  this.charNum = 0;
}

// Inherit of transform stream
util.inherits(CSVParser, Stream.Transform);

// Constants
CSVParser.STATE_FIELD = 1;
CSVParser.STATE_QUOTE_START = 2;
CSVParser.STATE_FIELD_QUOTED = 4;
CSVParser.STATE_QUOTE_END = 8;
CSVParser.STATE_ESC = 16;
CSVParser.STATE_ESC_CNT = 32;
CSVParser.STATE_LNSEP = 64;
CSVParser.STATE_FSEP = 128;

// Implement _transform underlying function
CSVParser.prototype._transform = function csvParserTransform(chunk, encoding, cb) {
  var _self = this;
  var string = chunk.toString();
  var matches;
  var curChar;

  for(var i=0; i<string.length; i++) {
    curChar = string[i];
    this.charNum++;
    // Looking for quoted fields start if quotes in options
    if(_self.options.quote.length && '' === _self._currentField &&
      !_self._discardStartQuote) {
      matches = getSeparatorMatches(_self.options.quote, _self._startQuotState + curChar);
      if(matches.length) {
        _self._startQuotState += curChar;
        _self._parsingState |= CSVParser.STATE_QUOTE_START;
        continue;
      }
      this._discardStartQuote = false;
      if(_self._parsingState&CSVParser.STATE_QUOTE_START) {
        _self._parsingState ^= CSVParser.STATE_QUOTE_START;
        if(-1 !== _self.options.quote.indexOf(_self._startQuotState)) {
          _self._parsingState |= CSVParser.STATE_FIELD_QUOTED;
          i--;
        } else {
          // Got an invalid quote char, reinjecting to the string
          i = i - _self._startQuotState.length - 1;
          if(i  < 0) {
            string = _self._startQuotState.substr(0, -i) + string;
            i = -1;
          }
          this._discardStartQuote = true;
        }
        continue;
      }
    }
    // Treating escapes (if some escape chars and no separator currently parsed)
    if(_self.options.esc.length && _self.options.toEsc.length) {
      // Checking for escaped chars
      if(_self._parsingState&CSVParser.STATE_ESC_CNT) {
        matches = getSeparatorMatches(_self.options.toEsc, _self._escChars + curChar);
        if(matches.length) {
          _self._escChars += curChar;
          continue;
        }
        _self._parsingState ^= CSVParser.STATE_ESC;
        _self._parsingState ^= CSVParser.STATE_ESC_CNT;
        // Got a valid escape char
        if(-1 !== _self.options.toEsc.indexOf(_self._escChars)) {
          _self._currentField += _self._escChars;
          i--;
        } else {
          // Special case, discard escape to avoid infinite loop
          _self._discardEsc = true;
          // Got an invalid escape char, reinjecting to the string
          i = i - _self._escState.length - _self._escChars.length - 1;
          if(i  < 0) {
            string = (_self._escState + _self._escChars).substr(0, -i) + string;
            i = -1;
          }
        }
        _self._escState = '';
        _self._escChars = '';
        continue;
      }
      // Checking for escapes matches
      if((!_self._discardEsc) && !(
          _self._parsingState&CSVParser.STATE_FSEP ||
          _self._parsingState&CSVParser.STATE_LNSEP ||
          _self._parsingState&CSVParser.STATE_QUOTE_START ||
          _self._parsingState&CSVParser.STATE_QUOTE_END
        )) {
        matches = getSeparatorMatches(_self.options.esc, _self._escState + curChar);
        if(matches.length) {
          _self._escState += curChar;
          _self._parsingState |= CSVParser.STATE_ESC;
          continue;
        }
      }
      _self._discardEsc = false   ;
      if(_self._parsingState&CSVParser.STATE_ESC) {
        // Got a valid escape char
        if(-1 !== _self.options.esc.indexOf(_self._escState)) {
          _self._parsingState |= CSVParser.STATE_ESC_CNT;
          i--;
        // Got an invalid escape char, reinjecting to the string
        } else {
          i = i - _self._escState.length - 1;
          if(i  < 0) {
            string = _self._escState.substr(0, -i) + string;
            i = -1;
          }
        }
        continue;
      }
    }
    // Looking for quoted fields contents and end
    if(_self._parsingState&CSVParser.STATE_FIELD_QUOTED && !this._discardEndQuot) {
      if(0 === _self._startQuotState.indexOf(_self._endQuotState + curChar)) {
        _self._endQuotState += curChar;
        _self._parsingState |= CSVParser.STATE_QUOTE_END;
        continue;
      }
      if(_self._parsingState&CSVParser.STATE_QUOTE_END) {
        // Got a valid quote char
        if(_self._startQuotState === _self._endQuotState) {
          _self._parsingState ^= CSVParser.STATE_QUOTE_END;
          _self._parsingState ^= CSVParser.STATE_FIELD_QUOTED;
          i--;
        } else {
          // Got an invalid quote char, reinjecting to the string
          i = i - _self._endQuotState.length - 1;
          if(i  < 0) {
            string = _self._endQuotState.substr(0, -i) + string;
            i = -1;
          }
          this._discardEndQuot = true;
        }
        _self._endQuotState = '';
        _self._startQuotState = '';
        continue;
      }
      if(_self._parsingState&CSVParser.STATE_FIELD_QUOTED) {
        _self._currentField += curChar;
        continue;
      }
    }
    this._discardEndQuot = false;
    // Detecting new field start
    if(!this._discardFSep) {
      matches = getSeparatorMatches(_self.options.sep, _self._fSep + curChar);
      if(matches.length) {
        _self._fSep += curChar;
        _self._parsingState |= CSVParser.STATE_FSEP;
        continue;
      }
    }
    this._discardFSep = false;
    // STATE_FSEP : We are waiting for some more field separators chars
    if(_self._parsingState&CSVParser.STATE_FSEP) {
      _self._parsingState ^= CSVParser.STATE_FSEP;
      if(-1 !== _self.options.sep.indexOf(_self._fSep)) {
        // Got a valid separator char
        _self._currentRow.push(_self._currentField);
        _self._currentField = '';
        i--;
      } else {
        // Got an invalid separator char, reinjecting to the string
        i = i - _self._fSep.length - 1;
        if(i  < 0) {
          string = _self._fSep.substr(0, -i) + string;
          i = -1;
        }
        this._discardFSep = true;
      }
      _self._fSep = '';
      continue;
    }
    // Detecting new lines start
    if(!this._discardLn) {
      matches = getSeparatorMatches(_self.options.linesep, _self._lnSep + curChar);
      if(matches.length) {
        _self._lnSep += curChar;
        _self._parsingState |= CSVParser.STATE_LNSEP;
        continue;
      }
    }
    this._discardLn = false;
    // STATE_LNSEP : We are waiting for some more line separators chars
    if(_self._parsingState&CSVParser.STATE_LNSEP) {
      _self._parsingState ^= _self._parsingState&(CSVParser.STATE_LNSEP|CSVParser.STATE_FSEP);
      if(-1 !== _self.options.linesep.indexOf(_self._lnSep)) {
        // Got a valid new line char
        if('' !== _self._currentField) {
          _self._currentRow.push(_self._currentField);
          _self._currentField = '';
        }
        if(_self._currentRow.length) {
          if(_self.options.fields) {
            _self.push(_self.options.fields.reduce(function(obj, field) {
              obj[field] = _self._currentRow.shift();
              return obj;
            }, {}));
          } else {
            _self.push(_self._currentRow);
          }
          _self._currentRow = [];
        }
        this.lineNum++;
        this.charNum = 0;
        i--;
      } else {
        // Got an invalid newline char, reinjecting to the string
        i = i - _self._lnSep.length - 1;
        if(i  < 0) {
          string = _self._lnSep.substr(0, -i) + string;
          i = -1;
        }
        this._discardLn = true;
      }
      _self._lnSep = '';
      continue;
    }
    // FIELD
    _self._currentField += curChar;
  }
  cb();
};

CSVParser.prototype._flush = function csvParserFlush(cb) {
  var _self = this;
  // Append a new line
  this._transform(new Buffer(this.options.linesep[0]+this.options.linesep[0]), 'buffer', function() {
  // Fail if a quoted field hasn't been closed
    if(_self._parsingState&CSVParser.STATE_FIELD_QUOTED) {
      _self.emit('error', new Error('Unclosed field detected.'));
    }
    cb();
  });
};

// Helpers
function getSeparatorMatches(seps, str) {
  return seps.filter(function(sep) {
    return str && 0 === sep.indexOf(str);
  });
}

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
    '(' + this.options.toEsc.map(escapeRegExpComponent).join('|') + ')',
    'gm'
  );

  // Build the quote search regular expression
  if(this.options.toQuote.length) {
    this._quoteRegExp = new RegExp(
      '(' + this.options.toQuote.map(escapeRegExpComponent).join('|') + ')',
      'gm'
    );
  }

}

// Inherit of transform stream
util.inherits(CSVEncoder, Stream.Transform);

// Implement _transform underlying function
CSVEncoder.prototype._transform = function csvEncoderTransform(row, encoding, cb) {
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
      var needQuote = false;
      if(_self.options.toQuote.length) {
        _self._quoteRegExp.lastIndex = 0;
        needQuote = _self._quoteRegExp.test(field+'');
      }
      return (needQuote ? _self.options.quote[0] : '') + (field+'').replace(
        _self._escRegExp,
        _self.options.esc[0] + '$1'
      ) + (needQuote ? _self.options.quote[0] : '');
    }).join(_self.options.sep[0]) + _self.options.linesep[0],
    encoding
  ));
  cb();
};

// X-Platform Excel encoder
function csvWrapForExcel(encoder) {
  // Pipe the CSV encoder to the ucs2 converter
  var converter = new Stream.Transform();
  var csvStream = new Stream.PassThrough();
  converter._transform = function(chunk, encoding, cb) {
    this.push(new Buffer(chunk.toString(), 'ucs2'));
    cb();
  };
  // Write the UCS2 BOM http://www.unicode.org/faq/utf_bom.html#bom1
  csvStream.write(new Buffer([0xFF, 0xFE]));
  return encoder.pipe(converter).pipe(csvStream);
}

module.exports = csv;

