[![npm version](https://img.shields.io/npm/v/mongoose-history-trace.svg?style=flat)](https://npmjs.org/package/mongoose-history-trace "View this project on npm")
[![Build Status](https://travis-ci.org/WelingtonMonteiro/mongoose-history-trace.svg?branch=master)](https://travis-ci.org/WelingtonMonteiro/mongoose-history-trace)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0d8d8cbe686ce95c0d11/test_coverage)](https://codeclimate.com/github/WelingtonMonteiro/mongoose-history-trace/test_coverage)
[![Dependencies](https://img.shields.io/david/WelingtonMonteiro/mongoose-history-trace.svg?style=flat)](https://david-dm.org/welingtonMonteiro/mongoose-history-trace)
![](https://img.shields.io/github/issues/WelingtonMonteiro/mongoose-history-trace.svg)
![](https://img.shields.io/snyk/vulnerabilities/npm/mongoose-history-trace.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/834a606870e24d2b8fc04020d81f299b)](https://www.codacy.com/manual/WelingtonMonteiro/mongoose-history-trace?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=WelingtonMonteiro/mongoose-history-trace&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/0d8d8cbe686ce95c0d11/maintainability)](https://codeclimate.com/github/WelingtonMonteiro/mongoose-history-trace/maintainability)
[![License](https://img.shields.io/github/license/WelingtonMonteiro/mongoose-history-trace.svg)](https://github.com/WelingtonMonteiro/mongoose-history-trace/blob/master/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/mongoose-history-trace.svg)](https://www.npmjs.com/package/mongoose-history-trace)
![](https://flat.badgen.net/bundlephobia/minzip/mongoose-history-trace)
[![NPM](https://nodei.co/npm/mongoose-history-trace.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/mongoose-history-trace/)

# Mongoose History Trace Plugin

> This plugin for [Mongoose][], aims to save the differences in the changes between the changed objects in the database, saving them in a collection and supporting their auditing.
  Currently supports all methods of mongoose: update , create, delete and its variations (findByIdAndUpdate, updateMany, updateOne, deleteMany, UpdaOne, FindOneAndUpdate, save, create, delete, update, etc.).
  

## Table of Contents

* [Introduction](#introduction)
* [Installation](#installation)
* [Usage](#usage)
* [Result Format](#result-format)
* [Methods](#methods)
   * [Model.addLoggedUser({ object })](#--addloggeduser-object-required)
   * [Model.getChangeDiffs(old, current)](#--getChangeDiffs-old-current)
   *[Model.createHistory({ old, current, loggedUser, method })](#--createHistory-old-current-loggedUser-method)
* [Options](#options)
   * [Custom value for label](#--custom-value-for-label-in-changeslabel)    
   * [Define custom path name in changes](#--changeTransform)
   * [Indexes](#--indexes)
   * [Define path user](#--userPaths)
   * [Save without logged user](#--isAuthenticated)
   * [Define custom collection name](#--customCollectionName)
   * [Define custom module name](#--moduleName)
   * [Omit paths collection on save](#--omitPaths)
   * [Save in other connection](#--connectionUri)
   * [Add new fields on logs](#--addCollectionPaths)
* [Credits](#credits)
* [Tests](#tests)
* [Contributing](#contributing)
* [License](#license)
 
## Introduction

> This mongoose plugin allows you to save changes in the models. It provides two kind of save history logs:

* It also register the activity in the `historyLogs` collection name by default.


## Install

[npm][] :

```sh
npm install mongoose-history-trace
```

[yarn][] :

```sh
yarn add mongoose-history-trace
````

Or add it to your package.json

## Usage

> Just add the pluging to the schema you wish to save history trace logs:

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
The plugin will create a new collection with name `historyTrace` by default. 

You can also change the name of the collection by setting the configuration customCollectionName:

```javascript
const mongooseHistoryTrace = require('mongoose-history-trace')


mongoose.plugin(mongooseHistoryTrace, options)
```

## Result Format

> The history trace logs documents have the format:


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
    "module": String           // name of collection by default
    "documentNumber": String   // _id of document schema
    "method": String           //name of method call: "updated" | "created" | "deleted"
}
```


## Methods
#### - addLoggedUser({ object }) [required]
> You can define logged user in request.
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
#### - getChangeDiffs(old, current)
> Returns list of differences between old and current objects.
 Call `getChangeDiffs(old, current)` method mongoose to return list of diffs. Example:

```javascript
{
  // omited logic
   ...

    const result = Model.getChangeDiffs(old, current)   //<-- SET LOGGED USER in context
    /**
    result:
     [{label, ops, path, from, to}]
    **/
}
```

#### - createHistory({ old, current, loggedUser, method })
> You can create a history log manually.
Call `createHistory({ old, current, loggedUser, method })` method mongoose to save diffs manually. Example:

```javascript
async function update (req, res) {
    const user = req.user   //< -- GET user on request
    // omited logic
    ...

    const params = { old, current, loogedUser: user, method: 'updated' }

    const result = Model.createHistory(params)   //<-- SET LOGGED USER in context
    
}
```

## Options

#### - Custom value for label in `changes.label`
> By default, the label name is the same as the capitalized schema field name.
It is possible to define a custom name, for that it is enough in the schema 
to pass the private field `_label_` and custom value `"new label"`. Example:

```javascript

const User = new Schema({
    "name": String, 
    "active": {"type": String, "_label_":"Other Name Label"}, //<- define custom label in path
    "phone": String
})

```
Thus, instead of saving the capitalized name of the schema field, 
save the name passed in the private field `_label_`. Example result:

```javascript

{
    //...omited fields          
    "changes": [ 
        {
            "to": true,       
            "path": "active",     
            "from": "",     
            "ops": "created",     
            "label": "Other Name Label"     //<- saved name pass in _label_ path in the schema 
        }
    ],
    //...omited fields
}

```
#### - changeTransform
> Define custom paths name in `changes`.
You can modify the paths name in `changes` field.
It is possible to define a custom path name, for this, just define a custom path name in options.

```javascript

{
    //...omited fields in options        
    "changeTransform": {
            "to": "newPathName",       
            "path": "newPathName",     
            "from": "newPathName",     
            "ops": "newPathName",     
            "label": "newPathName"      
        }
    //...omited fields in options
}

```
It is possible to change all fields in changes.

If the value of a field is empty, or is not passed, the default field is maintained.

#### - indexes
> You can define indexes in collection, for example:

```javascript
const options = {indexes: [{'documentNumber': -1, 'changes.path': 1}]}

User.plugin(mongooseHistory, options)
```

#### - userPaths
> Required if saved logged user.
Selects the fields in the object logged user will be saved.
If nothing is passed, then the log will not be saved:

```javascript
const options = {userPaths: ['name', 'email', 'address.city']}

User.plugin(mongooseHistory, options)
```

#### - isAuthenticated
> Path 'user' in log history is required, but you can saved logs without path loggedUser. Example:
Value default is `TRUE`

```javascript
const options = {isAuthenticated: false}

User.plugin(mongooseHistory, options)
```
So it is not necessary to pass the user logged into the `Model.addLoggedUser()` method. 
The resulting log will not contain the "user" field.

    "user": { Mixed }  // REMOVED


#### - customCollectionName
> You can define name of collection history trace logs.
By default, the collection name is `historyLogs`, example:

```javascript
const options = {customCollectionName: 'logs'}

User.plugin(mongooseHistory, options)
```

#### - moduleName
> You can define moduleName path saved in history trace logs.
By default, the module name is name of collection, example:

```javascript
const options = { moduleName: 'login-user' }

User.plugin(mongooseHistory, options)
```

#### - omitPaths
> You can omit paths do not saved in history trace logs in path `changes:[]` from collection.
By default, is paths `_id` and `__v` to be omited, example:

```javascript
const options = { omitPaths:['name', 'email', 'ip'] }

User.plugin(mongooseHistory, options)
```

#### - connectionUri
> You can save `history trace logs` collection in another url database.
By default, the collection is saved to the connection project itself, example:

```javascript
const options = { connectionUri: 'mongodb://localhost/other_db' }

User.plugin(mongooseHistory, options)
```

#### - addCollectionPaths
> You can add new paths in collection history trace logs, example:

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


## Credits

This work was inspired by:

* https://www.npmjs.com/package/mongoose-history
* https://github.com/drudge/mongoose-audit


## Tests
Run test with command: `npm test`


## Contributing

-   Use prettify and eslint to lint your code.
-   Add tests for any new or changed functionality.
-   Update the readme with an example if you add or change any functionality.
-   Open Pull Request

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


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[mongoose]: http://mongoosejs.com/
