'use strict'
const Promise = require('bluebird')
const { HistoryLogModel } = require('./historyLog-model')
const DeepDiff = require('./helper-diff')
const { isEmpty, get, assign, pick } = require('lodash')
const ACTIONS = {
  updated: 'Edited Document',
  deleted: 'Removed Document',
  created: 'Created Document',
  undefined: 'No Defined'
}
let _loggedUser = {}

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
    _loggedUser = loggedUser
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
    await _processCreateHistory.call(this, params, options)
  }

  schema.pre('save', async function () {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processPreSave.call(this, options)
  })

  schema.pre(/update|updateOne|findOneAndUpdate|findByIdAndUpdate|updateMany|findOneAndReplace|replaceOne/, async function () {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processPreUpdate.call(this, options)
  })

  schema.pre(/deleteOne|remove/, async function () {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processPreRemove.call(this, options)
  })

  schema.pre(/deleteMany/, async function () {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processRemoveMany.call(this, options)
  })

  schema.pre(/remove/, { document: false, query: true }, async function () {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processRemoveMany.call(this, options)
  })

  schema.post(/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/, async function (doc) {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processPosRemove.call(this, doc, options)
  })

  schema.post('insertMany', async function (docs) {
    this._loggedUser = _toJSON(_loggedUser)
    _loggedUser = {}
    await _processPosInsertMany.call(this, docs, options)
  })
}

/**
 * @author Welington Monteiro
 * @param { Object } json - object transform
 * @return {Object} return object to json
 * @private
 */
function _toJSON (json) {
  if (isEmpty(json)) return {}
  return JSON.parse(JSON.stringify(json))
}

/**
 * @author Welington Monteiro
 * @param {Object} doc - doc
 * @return {{method: *, documentNumber: *, module: *, changes: *, loggedUser: *, action: *}}
 */
function _mappedFieldsLog (doc = {}) {
  const { changes, module, documentNumber, method, user } = doc
  const action = ACTIONS[method]

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
  const { old = {}, current = {} } = params

  return DeepDiff.getDiff({ old, current }, {}, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } params
 * @param { Object } options - params configuration before saved log
 * @return {Promise<void>}
 * @private
 */
async function _processCreateHistory (params, options) {
  const old = _toJSON(get(params, 'old', {}))
  const current = _toJSON(get(params, 'current', {}))
  const schema = get(this, 'schema')
  const user = pick(get(params, 'loggedUser'), get(options, 'userPaths', []))
  const module = get(options, 'moduleName', get(this, 'mongooseCollection.name', get(this, 'collection.name')))
  const documentNumber = get(old, '_id')
  const method = get(params, 'method', 'undefined')

  const changes = DeepDiff.getDiff({ old, current }, schema, options)
  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @return {Promise<*>}
 */
async function _processPreUpdate (options) {
  const query = get(this, '_conditions')
  const schema = get(this, 'schema')
  const user = pick(get(this, '_loggedUser'), get(options, 'userPaths', []))
  const old = _toJSON(await this.findOne(query))
  const module = get(options, 'moduleName', get(this, 'mongooseCollection.name'))
  const mod = _toJSON(get(this, '_update.$set', get(this, '_update')))
  const documentNumber = get(old, '_id')
  const method = 'updated'

  if (isEmpty(old) || isEmpty(query)) return console.warn(`Not found documents to ${method} history logs.`)

  const current = assign({}, old, mod)
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
  Promise.map(olds, async (eachOld) => await _processPosRemove.call(this, eachOld, options))
}

/**
 * @author Welington Monteiro
 * @param { Array } docs - List of document inserted
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosInsertMany (docs, options) {
  return Promise.map(docs, async (eachDoc) => await _processPosSave.call(this, eachDoc, options))
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreRemove (options) {
  const query = get(this, '_conditions')
  const old = _toJSON(await this.findOne(query))

  await _processPosRemove.call(this, old, options)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreSave (options) {
  const module = get(options, 'moduleName', get(this, 'collection.name'))
  const schema = get(this, 'schema')
  const method = get(this, 'isNew') ? 'created' : 'updated'
  const user = pick(get(this, '_loggedUser'), get(options, 'userPaths', []))
  const current = _toJSON(this.toObject())
  const documentNumber = get(current, '_id')
  let changes = []

  if (this.isNew) {
    changes = DeepDiff.getDiff({ current }, schema, options)
  }

  if (!this.isNew) {
    const old = _toJSON(await this.constructor.findOne({ _id: documentNumber }))
    changes = DeepDiff.getDiff({ old, current }, schema, options)
  }

  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })
  await _saveHistoryLog(docMapped, options)
}

/**
 * @author Welington Monteiro
 * @param doc
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosSave (doc, options) {
  const module = get(options, 'moduleName', get(this, 'collection.name'))
  const schema = get(this, 'schema')
  const method = 'created'
  const user = pick(get(this, '_loggedUser'), get(options, 'userPaths', []))
  const current = _toJSON(doc.toObject())
  const documentNumber = get(current, '_id')
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
async function _processPosRemove (doc, options) {
  const old = _toJSON((doc.toObject ? doc.toObject() : doc))
  const schema = get(this, 'schema')
  const module = get(options, 'moduleName', get(this, 'mongooseCollection.name', get(this, 'collection.name')))
  const user = pick(get(this, '_loggedUser'), get(options, 'userPaths', []))
  const method = 'deleted'
  const documentNumber = get(old, '_id')
  const changes = DeepDiff.getDiff({ old }, schema, options)

  const docMapped = _mappedFieldsLog({ changes, method, module, documentNumber, user })

  await _saveHistoryLog(docMapped, options)
}

module.exports = HistoryPlugin
