# Mongoose History Trace Plugin

Keeps a history of all changes of a document on schema.

## Introduction

This mongoose plugin allows you to save changes in the models. It provides two kind of save history logs:

* It also register the activity in the *historyLogs* collection for default.

## Installation

```bash
npm install mongoose-audit
```

Or add it to your package.json

## Usage

Just add the pluging to the schema you wish to save history trace logs:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')

 ...
 
Schema.plugin(mongooseHistoryTrace, options)
```

In Mongoose models are linked to a connection. In case you wish to use a connection different that the default one to
store the auditlog you need to provide it in the options argument of the plugin call.
Also if you are using more than one connection probably you wish to have one auditlog per connection. Example:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')


Schema.plugin(mongooseHistoryTrace, options)
otherShema.plugin(mongooseHistoryTrace, options)
```
Or define plugin in global context mongoose for all schemas. Example:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')


mongoose.plugin(mongooseHistoryTrace, options)
```

## Credits

This work was inspired by:

* https://www.npmjs.com/package/mongoose-history
* https://github.com/drudge/mongoose-audit


## LICENSE
MIT License

Copyright (c) 2020 Welington Monteiro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
