# Mongoose Log Plugin

Keeps a history of all changes of a document.

## Introduction

Open source Mongodb does not provide an audit service (You have it available in the enterprise version).

This mongoose plugin allows you to audit changes in the models. It provides two kind of audits:

* In the modified collection it adds the fields: _updateAt, _createdAt and _user (optional).
* It also register the activity in the  *auditlog* collection.

The fields of the auditlog documents are:

* ts: The timestamp
* operation: create, update or delete
* location: The affected collection
* document: The document before the operation
* user: The user (optional)

In case you wish to include the user in the audit, you must provide in the document at some point in your code.
You just need to make usage of the 'protected' attribute _user.

IMPORTANT!!! This plugin is able to audit operations that work with mongoose documents. Mongoose model operations aren't audited.
Example: Model.remove({...}) won't work. You need to do a remove in the located document after a Model.find({...}) operation.

## Installation

```bash
npm install mongoose-audit
```

Or add it to your package.json

## Usage

Just add the pluging to the schema you wish to audit:

```javascript
Schema.plugin(require('moongose-audit'));
```

In Mongoose models are linked to a connection. In case you wish to use a connection different that the default one to
store the auditlog you need to provide it in the options argument of the plugin call.
Also if you are using more than one connection probably you wish to have one auditlog per connection. Example:

```javascript
anSchema.plugin(require('moongose-audit'), {connection: myConnection})
otherShema.plugin(require('moongose-audit'), {connection: otherConnection})
```


## Credits

This work was inspired by:

* https://www.npmjs.com/package/mongoose-history
* https://github.com/drudge/mongoose-audit


## LICENSE

Copyright (c) 2020
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

