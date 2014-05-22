# CSV
Simple and parametrable CSV parser and encoder.

## Usage
```js
var csv = require('badass-csv');

// Parsing CSV
var parser = new csv.Parser({
  fields: ['id', 'name', 'email'],
  sep: ',',
  esc: '\\',
  linesep: ['\n', '\r', '\r\n']
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// {
//  id: 1,
//  name: 'Nicolas Froidure',
//  email: 'nicolas.froidure@simplifield.com'
// }

parser.end();

// Alternatively, you can use the array mode
var parser = new csv.Parser({
  fields: ['id', 'name', 'email'],
  sep: ',',
  esc: '\\',
  linesep: ['\n', '\r', '\r\n'],
  arrayMode: true
});

parser.write('1,Nicolas Froidure,nicolas.froidure@simplifield.com');
// [1, 'Nicolas Froidure', 'nicolas.froidure@simplifield.com']

parser.end();


// Reading CSV
var encoder = new csv.Encoder({
  fields: ['id', 'name', 'email'],
  sep: ',',
  esc: '\\',
  linesep: ['\n', '\r', '\r\n']
});

encoder.pipe(process.stdout);

// Array form
encoder.write([1, 'Nicolas Froidure', 'nicolas.froidure@simplifield.com']);
// '1,Nicolas Froidure,nicolas.froidure@simplifield.com'

// Object form
encoder.write({
  id:1,
  email: 'nicolas.froidure@simplifield.com',
  name: 'Nicolas Froidure'
});
// '1,Nicolas Froidure,nicolas.froidure@simplifield.com'


// Transforming (no library needed, DIY)
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

// Detecting fields (later)
```


