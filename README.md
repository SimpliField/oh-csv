# OH - CSV
Simple and parametrable CSV/TSV parser and encoder.

## Usage
```js
var csv = require('oh-csv');
```

### Parsing CSV
```js
var parser = new csv.Parser({
  fields: ['id', 'name', 'email'],
  sep: ',',
  esc: '\\',
  quotes: '"',
  linesep: ['\n', '\r', '\r\n']
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// {
//  id: 1,
//  name: 'Nicolas Froidure',
//  email: 'nicolas.froidure@simplifield.com'
// }

parser.end();
```

Alternatively, you can use the array mode:

```js
var parser = new csv.Parser({
  fields: ['id', 'name', 'email'],
  sep: ',',
  esc: '\\',
  quotes: '"',
  linesep: ['\n', '\r', '\r\n'],
  arrayMode: true
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// [1, 'Nicolas Froidure', 'nicolas.froidure@simplifield.com']

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
var transformer = new Transform({objectMode: true});
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
There are CSV and TSV predefined objects in order to allow you tu just choose
 your format


#### csv.csvOpts

[CSV (Comma-Separated Values)](http://en.wikipedia.org/wiki/Comma-separated_values)

#### csv.tsvOpts

[TSV (Tabulation-Separated Values)](http://en.wikipedia.org/wiki/Tab-separated_values)

#### csv.csvRFCOpts

The [RFC 4180](http://tools.ietf.org/html/rfc4180) CSV format.
