'use strict'
const Promise = require('bluebird')
const { HistoryLogModel } = require('./model')
const DeepDiff = require('./diffHelper')
const { isEmpty, get, assign, pick, set } = require('lodash')

/**
 *
 * @param { mongoose } schema - schema mongoose
 * @param { Object } options
 * @example {
 *   userPaths: []                              //name paths user to saved on logs
 *   isAuthenticate: true                       //default is true
 *   customCollectionName: String               //default is collection name
 *   connectionUri: String                      //default is connection of collection
 *   moduleName: String                         //default is collection name
 *   indexes: [
 *        {'path': 1},                          //paths create index on history log collection
 *        {'path': -1},
 *        {'path': 'text'}
 *   ]
 *   omitPaths: ['_id', '__v']                  //paths omit on created history log
 *   addCollectionPaths: [                      //add paths in collection history log
 *      {key: 'path1', value: 'String' },       //    key - name path
 *      {key: 'path2', value: 'String' },       //    value - mongoose types .('ObjectId', 'Mixed', 'String', 'Number', etc)
 *      {key: 'path3.path2',                    //    sudoc : {key: 'field.subdoc', value: 'String'}
 *          value: 'ObjectId' },
 *   ],
 *   changeTransform: {
 *     to: 'newPathToView'                      //new value to path 'to' transform to view
 *     from: 'newPathToView'                    //new value to path 'from' transform to view
 *     label: 'newPathToView'                   //new value to path 'label' transform to view
 *     ops: 'newPathToView'                     //new value to path 'ops' transform to view
 *     path: 'newPathToView'                    //new value to path 'path' transform to view
 *   }
 *
 * }
 */
function HistoryPlugin (schema, options = {}) {
  /**
   * @author Welington Monteiro
   * @param { Object } loggedUser - Logged user from request
   */
  schema.statics.addLoggedUser = function (loggedUser) {
    set(schema, '_loggedUser', loggedUser)
  }
  /**
   * @author welington Monteiro
   * @param { Object } [old] - old state json object
   * @param { Object } [current] - current state json object
   * @return {Array} changes -  return array changes diffs
   */
  schema.statics.getChangeDiffs = async function (old, current) {
    return _processGetDiffs.call(this, { old, current }, options)
  }

  /**
   * @author Welington Monteiro
   * @param { Object } params
   */
  schema.statics.createHistory = async function (params) {
    await _processCreateHistory.call(getCurrentUser.call(this, schema, params), params, options)
  }

  schema.pre('save', async function () {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processPreSave, options)
  })

  schema.pre(/update|updateOne|findOneAndUpdate|findByIdAndUpdate|updateMany|findOneAndReplace|replaceOne/, async function () {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processPreUpdate, options)
  })

  schema.pre(/deleteOne|remove/, async function () {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processPreRemove, options)
  })

  schema.pre(/deleteMany/, async function () {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processRemoveMany, options)
  })

  schema.pre(/remove/, { document: false, query: true }, async function () {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processRemoveMany, options)
  })

  schema.post(/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/, async function (doc) {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processPosRemove, options, doc)
  })

  schema.post('insertMany', async function (docs) {
    await initializeProcess.call(getCurrentUser.call(this, schema), _processPosInsertMany, options, docs)
  })
}

/**
 * @author Welington Monteiro
 * @param { Schema } schema - mongoose Schema
 * @param params
 * @return {getCurrentUser} - return this context with logged user
 */
function getCurrentUser (schema, params) {
  const _loggedUser = get(schema, '_loggedUser', {})
  const loggedUser = get(params, 'loggedUser', {})
  this._loggedUser = _toJSON(!isEmpty(_loggedUser) ? _loggedUser : loggedUser)
  delete schema._loggedUser
  return this
}

/**
 * @author Welington Monteiro
 * @param { function } method - method call to process
 * @param { Object } options - params configuration before saved log
 * @param {Array | Object } docs - data document
 * @return {Promise<void>}
 */
async function initializeProcess (method, options, docs) {
  await method.call(this, options, docs)
}

/**
 * @author Welington Monteiro
 * @param { Object } json - object transform
 * @return {Object} return object to json
 * @private
 */
function _toJSON (json) {
  if (isEmpty(json)) { return {} }
  return JSON.parse(JSON.stringify(json))
}

/**
 * @author Welington Monteiro
 * @param {Object} doc - doc
 * @return {{method: *, documentNumber: *, module: *, changes: *, loggedUser: *, action: *}}
 */
function _mappedFieldsLog (doc = {}) {
  const actions = {
    updated: 'Edited Document',
    deleted: 'Removed Document',
    created: 'Created Document',
    undefined: 'No Defined'
  }
  const { changes, module, documentNumber, method, user } = doc
  const action = get(actions, `${method}`, method)
  return { changes, action, module, documentNumber, method, user }
}

/**
 *@author Welington Monteiro
 * @param { Object } object - object mapped to saved
 * @param { Object } options - params configuration before saved log
 */
async function _saveHistoryLog (object, options) {
  if (isEmpty(get(object, 'changes'))) {
    console.warn('MONGOOSE-HISTORY-TRACE: path: {changes} no diffs documents.')
    return
  }
  if (isEmpty(get(object, 'user')) && get(options, 'isAuthenticated', true)) {
    console.warn('MONGOOSE-HISTORY-TRACE: path: {user} is required. Example: Model.addLoggedUser(req.user)')
    return
  }
  const HistoryLog = HistoryLogModel(options)
  const history = new HistoryLog(object)
  return await history.save()
}

/**
 * @author Welington Monteiro
 * @param { object } params
 * @param { Object } options - params configuration options plugin
 * @return {Array}
 * @private
 */
async function _processGetDiffs (params, options) {
  const old = get(params, 'old', {})
  const current = get(params, 'current', {})

  return DeepDiff.getDiff({ old, current }, {}, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration options plugin
 * @param { Object } [params] - params paths to save history
 * @param { Object } [doc] - object to save
 * @param { String } method - name of method to save
 * @return { Object } - return object mounted to save
 */
async function mountDocToSave ({ options, params, doc }, method) {
  const self = this
  let result = {}

  set(result, 'old', _toJSON(get(params, 'old', {})))
  set(result, 'current', _toJSON(get(params, 'current', {})))
  set(result, 'schema', get(self, 'schema'))
  set(result, 'user', pick(get(self, '_loggedUser'), get(options, 'userPaths', [])))
  set(result, 'module', get(options, 'moduleName', get(self, 'mongooseCollection.name', get(self, 'collection.name'))))
  set(result, 'method', (method || get(params, 'method', 'undefined')))

  if ({}.hasOwnProperty.call(self, 'isNew')) {
    result = await _helperPreSave.call(this, result)
  }
  if (!isEmpty(doc)) {
    result = _helperPosSaveWithDoc.call(this, result, doc)
  }
  if (method === 'updated') {
    result = await _helperPreUpdate.call(this, result)
  }
  set(result, 'documentNumber', get(result, 'old._id', get(result, 'current._id')))
  return result
}

/**
 * @author Welington Monteiro
 * @param { Object } result - result Object mount paths to save
 * @return { Object } - return object mount
 * @private
 */
async function _helperPreSave (result) {
  const self = this
  set(result, 'method', (get(self, 'isNew') ? 'created' : 'updated'))
  set(result, 'current', _toJSON(self.toObject ? self.toObject() : self))
  const _id = get(result, 'current._id')

  if (!self.isNew) { set(result, 'old', _toJSON(await self.constructor.findOne({ _id }))) }
  return result
}

/**
 * @author Welington Monteiro
 * @param { Object } result - result Object mount paths to save
 * @return { Object } - return object mount
 * @private
 */
async function _helperPreUpdate (result) {
  const self = this

  const query = get(self, '_conditions')
  if (isEmpty(query)) { return console.warn(`Not found documents to ${result.method} history logs.`) }
  const old = _toJSON(await self.findOne(query))
  if (isEmpty(old)) { return console.warn(`Not found documents to ${result.method} history logs.`) }
  const mod = _toJSON(get(self, '_update.$set', get(self, '_update')))

  set(result, 'old', old)
  set(result, 'current', assign({}, old, mod))

  return result
}

/**
 *
 * @param { Object } result - result Object mount paths to save
 * @param { Object } doc - object to save
 * @return { Object } - return object mount
 * @private
 */
function _helperPosSaveWithDoc (result, doc) {
  if (result.method === 'created') {
    set(result, 'current', _toJSON(doc.toObject ? doc.toObject() : doc))
  }
  if (result.method === 'deleted') {
    set(result, 'old', _toJSON((doc.toObject ? doc.toObject() : doc)))
  }
  return result
}

/**
 * @author Welington Monteiro
 * @param { Object } params - params to save history manually
 * @param { Object } options - params configuration before saved log
 * @return {Promise<void>}
 * @private
 */
async function _processCreateHistory (params, options) {
  const {
    schema, user, module, method,
    old, current, documentNumber
  } = await mountDocToSave.call(this, { options, params })

  const changes = DeepDiff.getDiff({ old, current }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processRemoveMany (options) {
  const query = get(this, '_conditions')
  const olds = _toJSON(await this.find(query))
  Promise.map(olds, async (eachOld) => await _processPosRemove.call(this, options, eachOld))
}

/**
 * @author Welington Monteiro
 * @param { Array } docs - List of document inserted
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosInsertMany (options, docs) {
  return Promise.map(docs, async (eachDoc) => await _processPosSave.call(this, options, eachDoc))
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreRemove (options) {
  const query = get(this, '_conditions')
  const old = _toJSON(await this.findOne(query))

  await _processPosRemove.call(this, options, old)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @return {Promise<*>}
 */
async function _processPreUpdate (options) {
  const {
    schema, user, module, method,
    old, current, documentNumber
  } = await mountDocToSave.call(this, { options }, 'updated')

  const changes = DeepDiff.getDiff({ old, current }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreSave (options) {
  const {
    schema, user, module, method,
    old, current, documentNumber
  } = await mountDocToSave.call(this, { options })

  const changes = DeepDiff.getDiff({ old, current }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param doc
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosSave (options, doc) {
  const {
    schema, user, module, method,
    current, documentNumber
  } = await mountDocToSave.call(this, { options, doc }, 'created')

  const changes = DeepDiff.getDiff({ current }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } doc - object mapped
 * @param { Object } options - params configuration before saved log
 * @return {Promise<void>}
 */
async function _processPosRemove (options, doc) {
  const {
    schema, user, module,
    method, old, documentNumber
  } = await mountDocToSave.call(this, { options, doc }, 'deleted')

  const changes = DeepDiff.getDiff({ old }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

module.exports = HistoryPlugin
