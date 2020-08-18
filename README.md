# Mongoose History Trace Plugin

Keeps a history of all changes of a document on schema.

## Introduction

This mongoose plugin allows you to save changes in the models. It provides two kind of save history logs:

* It also register the activity in the *historyLogs* collection for default.

## Installation

```bash
npm install mongoose-history-trace
```

Or add it to your package.json

## Usage

Just add the pluging to the schema you wish to save history trace logs:

```javascript
const mongoose = require('mongoose')
const mongooseHistoryTrace = require('mongoose-history-trace')
const Schema  = mongoose.Schema

const User = new Schema({
    name: String, 
    email: String,
    phone: String
})

User.plugin(mongooseHistoryTrace, options)
```
This will generate a log from al your changes on this schema.

Or define plugin in global context mongoose for all schemas. Example:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')


mongoose.plugin(mongooseHistoryTrace, options)
```
The plugin will create a new collection with name : historyTrace per default. 
You can also change the name of the collection by setting the configuration customCollectionName:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')


mongoose.plugin(mongooseHistoryTrace, options)
```
The history trace logs documents have the format:


```javascript
{
    "_id": ObjectId,
    "createdAt": ISODate,
    "changes": [ 
        {
            "to": String,       // current path modification
            "path": String,     // name path schema
            "from": String,     // old path modification
            "ops": String,      // name operation "updated" | "created" | "deleted",
            "label": String     // name capitalized path schema 
        }
    ],
    "action": String           //name action "Created Document" | "Updated Document" | "Removed Document",
    "module": String           // name of collection per default
    "documentNumber": String   // _id of document schema
    "method": String           //name of method call: "updated" | "created" | "deleted"
}
```
## Options
#### - Indexes
You can define indexes in collection, for example:

```javascript
const options = {indexes: [{'documentNumber': -1, 'changes.path': 1}]}

User.plugin(mongooseHistory, options)
```

#### - customCollectionName
You can define name of collection history trace logs.
By default, the name is **historyLogs**, for example:

```javascript
const options = {customCollectionName: 'logs'}

User.plugin(mongooseHistory, options)
```

#### - moduleName
You can define moduleName path saved in history trace logs.
By default, the module name is name of collection, for example:

```javascript
const options = { moduleName: 'login-user' }

User.plugin(mongooseHistory, options)
```

#### - omitPaths
You can omit paths do not saved in history trace logs in path `changes:[]` from collection.
By default, is paths `_id` and `__v` to be omited, for example:

```javascript
const options = { omitPaths:['name', 'email', 'ip'] }

User.plugin(mongooseHistory, options)
```

#### - connectionUri
You can save `history trace logs` collection in another url database.
By default, the collection is saved to the connection project itself, for example:

```javascript
const options = { connectionUri: 'mongodb://localhost/other_db' }

User.plugin(mongooseHistory, options)
```

#### - addCollectionPaths
You can add new paths in collection history trace logs, for example:

```javascript
const options = { addCollectionPaths:[
        {key: 'field1', value: 'String'},
        {key: 'field2', value: 'Date', defaultValue: ''},
        {key: 'field1.subField', value: 'String'},         
] }

User.plugin(mongooseHistory, options)
```
**key** - name path

**value** - [optional] mongoose types. Example:(`'ObjectId'`, `'Mixed'`, `'String'`, `'Number'`, etc).
default value is mongoose types `'Mixed'`.

**defaultValue** - [optional] define the default value of path

_**Obs.:**_ It is not possible to add new fields in the `changes` field. New fields will be added to the collection body.


### In progress

* Method save logged user on history logs from request.
* define label name in ```changes.label``` path.


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
