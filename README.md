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
This will generate a log from all your changes on this schema.

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

## Result Log format

The history trace logs documents have the format:


```javascript
{
    "_id": ObjectId,
    "createdAt": ISODate,
    "user": { Mixed }           // paths defined for you
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


## Method Static
#### - addLoggedUser({ object }, [fields]) [required]
You can define logged user in request.

Initialize the plugin using the `addLoggedUser()` method, before call method mongoose. 

Pass in second parameter, list of string contain names paths on saved. Example: 

```javascript
async function update (req, res) {
    const user = req.user   //< -- GET user on request
    ...

    Model.addLoggedUser(user)   //<-- SET LOGGED USER in context
    
    const result = await Model.findByIdAndUpdate(query, {$set: mod})

    return res.send(result)    
}
```

## Options
#### - indexes
You can define indexes in collection, for example:

```javascript
const options = {indexes: [{'documentNumber': -1, 'changes.path': 1}]}

User.plugin(mongooseHistory, options)
```

#### - userPaths
Required if saved logged user

Selects the fields in the object logged user will be saved.

If nothing is passed, then the log will not be saved:

```javascript
const options = {userPaths: ['name', 'email', 'address.city']}

User.plugin(mongooseHistory, options)
```

#### - isAuthenticated
Path 'user' in log history is required, but you can saved logs without path loggedUser. Example:

Value default is `TRUE`
```javascript
const options = {isAuthenticated: false}

User.plugin(mongooseHistory, options)
```
So it is not necessary to pass the user logged into the `Model.addLoggedUser()` method. 
The resulting log will not contain the "user" field.

    "user": { Mixed }  // REMOVED


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

* define label name in ```changes.label``` path.
* save manual logs


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
