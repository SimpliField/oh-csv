# OH - CSV
Simple and parametrable CSV/TSV parser and encoder.

[![NPM version](https://badge.fury.io/js/oh-csv.png)](https://npmjs.org/package/oh-csv) [![Build status](https://secure.travis-ci.org/SimpliField/oh-csv.png)](https://travis-ci.org/SimpliField/oh-csv) [![Dependency Status](https://david-dm.org/SimpliField/oh-csv.png)](https://david-dm.org/SimpliField/oh-csv) [![devDependency Status](https://david-dm.org/SimpliField/oh-csv/dev-status.png)](https://david-dm.org/SimpliField/oh-csv#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/SimpliField/oh-csv/badge.png?branch=master)](https://coveralls.io/r/SimpliField/oh-csv?branch=master) [![Code Climate](https://codeclimate.com/github/SimpliField/oh-csv.png)](https://codeclimate.com/github/SimpliField/oh-csv)

## Usage
```js
var csv = require('oh-csv');
```

### Parsing CSV

```js
var parser = new csv.Parser({
  sep: ',',
  linesep: ['\n', '\r', '\r\n'],
  quote: '"',
  esc: '\\'
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// [1, 'Nicolas Froidure', 'nicolas.froidure@simplifield.com']

parser.end();
```

Alternatively, you can specify fields to map them to an object properties:
```js
var parser = new csv.Parser({
  fields: ['id', 'name', 'email'], // fields are required for this mode
  sep: ',',
  linesep: ['\n', '\r', '\r\n'],
  quote: '"',
  esc: '\\'
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// {
//  id: 1,
//  name: 'Nicolas Froidure',
//  email: 'nicolas.froidure@simplifield.com'
// }

parser.end();
```

### Encoding to CSV

```js
var encoder = new csv.Encoder({
  fields: ['id', 'name', 'email']
});

encoder.pipe(process.stdout);

// Array form
encoder.write([1, 'Nicolas Froidure', 'nicolas.froidure@simplifield.com']);
// '1,Nicolas Froidure,nicolas.froidure@simplifield.com'

// Object form (you need to specify fields)
encoder.write({
  id:1,
  email: 'nicolas.froidure@simplifield.com',
  name: 'Nicolas Froidure'
});
// '1,Nicolas Froidure,nicolas.froidure@simplifield.com'
```

### Transforming rows

No library needed, DIY !

```js
var Transform = require('stream').Transform;
var transformer = new Transform({arrayMode: false});
transformer._transform = function(row, unused, cb) {
  row[name] = row[name].toLowerCase();
  this.push(row);
  cb();
};

parser
  .pipe(transformer)
  .pipe(encoder);

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// 1,nicolas froidure,nicolas.froidure@simplifield.com
```

### Predefined options
There are some CSV and TSV predefined objects in order to allow you tu just
 easily choose your format.


#### csv.csvOpts

[CSV (Comma-Separated Values)](http://en.wikipedia.org/wiki/Comma-separated_values)
 as it's commonly found.

#### csv.tsvOpts

[TSV (Tabulation-Separated Values)](http://en.wikipedia.org/wiki/Tab-separated_values)

#### csv.csvRFCOpts

The [RFC 4180](http://tools.ietf.org/html/rfc4180) CSV format.

## API

### csv.Parser(options:Object)

Create a new CSV Parser transform stream with `options` as defined in the
 options section.

### csv.Encoder(options:Object)

Create a new CSV Encoder transform stream with `options` as defined in
 the options section.

### Options

The options object is meant to be usable either with the Parser and the Encoder.

#### options.sep:Array
Default: `[',']`

The strings used for separating values. The first string is used to encode CSV.

#### options.linesep:Array
Default: `['\r\n', '\r', '\n']`

The strings used for separating lines. The first string is used to encode CSV.

#### options.quote:Array
Default: `['"']`

The strings used for quoting values. The first string is used to encode CSV.

#### options.toQuote:Array
Default: An array containing `options.sep`, `options.linesep` strings.

If a field contains any occurence of the given strings, it must be quoted.


#### options.esc:Array
Default: `['\\']`

The strings used for escaping special chars. The first string is used to encode CSV.

#### options.toEsc:Array
Default: If `options.esc` is empty, an empty array. If `options.quote` is empty,
 an array containing `options.sep`, `options.linesep`, `options.quote` and
 `options.esc` strings, otherwise, an array containing `options.quote` and
 `options.esc`.

The strings that must be escaped.
