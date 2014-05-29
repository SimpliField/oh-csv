var Stream = require('readable-stream');
var util = require('util');
var escapeRegExpComponent = require('escape-regexp-component');

// Predefined configuration
var csvOpts = {
  sep: [','],
  esc: ['\\'],
  quote: [''],
  linesep: ['\r\n', '\n', '\r']
};
var csvQuotOpts = {
  sep: [','],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  esc: ['\\']
};
var tsvOpts = {
  sep: ['\t'],
  linesep: ['\r\n', '\n', '\r'],
  quote: [''],
  esc: ['\\']
};
var csvRFCOpts = {
  sep: [','],
  linesep: ['\r\n', '\n', '\r'],
  quote: ['"'],
  esc: ['"'],
  toEsc: ['"']
};

// CSV object
var csv = {
  Parser: CSVParser,
  Encoder: CSVEncoder,
  csvOpts: csvOpts,
  csvQuotOpts: csvQuotOpts,
  tsvOpts: tsvOpts,
  csvRFCOpts: csvRFCOpts
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
  if(options.quote && 'string' === typeof options.quote) {
    options.quote = [options.quote];
  } else {
    options.quote = options.quote || [];
  }
  options.toEsc = (
    options.toEsc ||
    options.quote.concat(options.sep).concat(options.linesep)
      .concat(options.esc)
  ).filter(function(s) { return s; });
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
  this._fSep = '';
  this._escState = '';
  this._escChars = '';
  this._discardEsc = false;
  this._startQuotState = '';
  this._endQuotState = '';
  this._currentRow = [];
  this._currentField = '';
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
  var n;

  for(var i=0; i<string.length; i++) {
    this.charNum++;
    // Looking for quoted fields start if quotes in options
    if(_self.options.quote.length && '' == _self._currentField) {
      matches = getSeparatorMatches(_self.options.quote, _self._startQuotState + string[i]);
      if(matches.length) {
        _self._startQuotState += string[i];
        _self._parsingState |= CSVParser.STATE_QUOTE_START;
        continue;
      }
      if(_self._parsingState&CSVParser.STATE_QUOTE_START) {
        _self._parsingState ^= CSVParser.STATE_QUOTE_START;
        matches = getSeparatorMatches(_self.options.quote, _self._startQuotState);
        if(matches.length) {
          _self._parsingState |= CSVParser.STATE_FIELD_QUOTED;
          i--;
        } else {
          // Got an invalid quote char, reinjecting to the string
          i = i - _self._startQuotState.length - 1;
          if(i  < 0) {
            string = _self._startQuotState.substr(0, -i) + string;
            i = -1;
          }
        }
        continue;
      }
    }
    // Treating escapes (if some escape chars and no separator currently parsed)
    if(_self.options.esc.length && _self.options.toEsc.length) {
      // Checking for escaped chars
      if(_self._parsingState&CSVParser.STATE_ESC_CNT) {
        matches = getSeparatorMatches(_self.options.toEsc, _self._escChars + string[i]);
        if(matches.length) {
          _self._escChars += string[i];
          continue;
        }
        matches = getSeparatorMatches(_self.options.toEsc, _self._escChars);
        _self._parsingState ^= CSVParser.STATE_ESC;
        _self._parsingState ^= CSVParser.STATE_ESC_CNT;
        // Got a valid escape char
        if(matches.length) {
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
        matches = getSeparatorMatches(_self.options.esc, _self._escState + string[i]);
        if(matches.length) {
          _self._escState += string[i];
          _self._parsingState |= CSVParser.STATE_ESC;
          continue;
        }
      }
      _self._discardEsc = false   ;
      if(_self._parsingState&CSVParser.STATE_ESC) {
        matches = getSeparatorMatches(_self.options.esc, _self._escState);
        // Got a valid escape char
        if(matches.length) {
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
    if(_self._parsingState&CSVParser.STATE_FIELD_QUOTED) {
      if(0 === _self._startQuotState.indexOf(_self._endQuotState + string[i])) {
        _self._endQuotState += string[i];
        _self._parsingState |= CSVParser.STATE_QUOTE_END;
        continue;
      }
      if(_self._parsingState&CSVParser.STATE_QUOTE_END) {
        // Got a valid quote char
        if(_self._startQuotState == _self._endQuotState) {
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
        }
        _self._endQuotState = '';
        _self._startQuotState = '';
        continue;
      }
      if(_self._parsingState&CSVParser.STATE_FIELD_QUOTED) {
        _self._currentField += string[i];
        continue;
      }
    }
    // Detecting new lines start
    matches = getSeparatorMatches(_self.options.linesep, _self._lnSep + string[i]);
    if(matches.length) {
      _self._lnSep += string[i];
      _self._parsingState |= CSVParser.STATE_LNSEP;
      continue;
    }
    // STATE_LNSEP : We are waiting for some more line separators chars
    if(_self._parsingState&CSVParser.STATE_LNSEP) {
      matches = getSeparatorMatches(_self.options.linesep, _self._lnSep);
      _self._parsingState ^= _self._parsingState&(CSVParser.STATE_LNSEP|CSVParser.STATE_FSEP);
      _self._lnSep = '';
      if(matches.length) {
        // Got a valid line char
        if('' != _self._currentField) {
          _self._currentRow.push(_self._currentField);
          _self._currentField = '';
        }
        if(_self._currentRow.length) {
          _self.push(_self._currentRow);
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
      }
      continue;
    }
    // Detecting new field start
    matches = getSeparatorMatches(_self.options.sep, _self._fSep + string[i]);
    if(matches.length) {
      _self._fSep += string[i];
      _self._parsingState |= CSVParser.STATE_FSEP;
      continue;
    }
    // STATE_FSEP : We are waiting for some more field separators chars
    if(_self._parsingState&CSVParser.STATE_FSEP) {
      matches = getSeparatorMatches(_self.options.sep, _self._fSep);
      _self._parsingState ^= CSVParser.STATE_FSEP;
      if(matches.length) {
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
      }
      _self._fSep = '';
      continue;
    }
    // FIELD
    if(_self._parsingState&CSVParser.STATE_FIELD) {
      _self._currentField += string[i];
      continue;
    }
    // LINE
    if('\u0000' != string[i]) {
      this.emit('error', new Error('Unexpected char "'+string[i]+'".'));
    }
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
      return (_self.options.quote[0] || '') + (field+'').replace(
        _self._escRegExp,
        _self.options.esc[0] + '$1'
      ) + (_self.options.quote[0] || '');
    }).join(_self.options.sep[0]) + _self.options.linesep[0],
    encoding
  ));
  cb();
};

module.exports = csv;

