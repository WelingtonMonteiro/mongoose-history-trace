'use strict'

const { get, set, isEmpty, isArray, merge } = require('lodash')
const mongoose = require('mongoose')
const TYPES = mongoose.Schema.Types
const Schema = mongoose.Schema
const DEFAULT_COLLECTION_NAME = 'historyLogs'
mongoose.Promise = global.Promise

/**
 * Create and cache a history mongoose model
 * @param { Object } [options]
 * @return {mongoose.Model} History Log Model
 */
module.exports.HistoryLogModel = function (options) {
  const collectionName = get(options, 'customCollectionName', DEFAULT_COLLECTION_NAME)

  if (!(collectionName in mongoose.models)) {
    return initializeInstanceModel(collectionName, options)
  }
  return mongoose.models[collectionName]
}

/**
 * @author Weligton Monteiro
 * @return { {schema} } - return new instance schema
 * @constructor
 */
function DefaultSchema () {
  return {
    documentNumber: { type: TYPES.String, required: true },
    action: { type: TYPES.String, required: true },
    method: { type: TYPES.String, required: true },
    user: { type: TYPES.Mixed, require: true },
    createdAt: { type: TYPES.Date, required: true, default: Date.now },
    module: { type: TYPES.String, require: true },
    changes: { type: [TYPES.Mixed], required: true }
  }
}

/**
 * @author Welington Monteiro
 * @param { mongoose } mongooseInstance
 * @return { Object } - return options mongoose instance
 */
function getOptionsVersionInstance (mongooseInstance) {
  const version = parseInt(get(mongooseInstance, 'version'))
  if (version < 5) {
    return merge({}, { useMongoClient: true })
  }
  return merge({}, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, autoIndex: true })
}

/**
 *
 * @param { String } collectionName - collection name of model
 * @param { Object } options - options plugin schema
 * @return {*}
 */
function initializeInstanceModel (collectionName, options) {
  const connectionUri = get(options, 'connectionUri')

  const schema = initializeDefaultSchema(options)

  if (connectionUri) {
    return otherConnection(collectionName, options)
  }
  return getOrAddNewInstanceModel(mongoose, collectionName, schema)
}

/**
 * @author Welington Monteiro
 * @param { mongoose } mongooseInstance - mongoose instance
 * @param { String } collectionName - collection name of model
 * @param { schema } schema - schema default
 * @return { Model} - return model instance
 */
function getOrAddNewInstanceModel (mongooseInstance, collectionName, schema) {
  if (mongooseInstance.models[collectionName]) {
    return mongooseInstance.models[collectionName]
  } else {
    return mongooseInstance.model(collectionName, schema, collectionName)
  }
}

/**
 * @author Welington Monteiro
 * @param { Object } options - options plugin schema
 */
function initializeDefaultSchema (options) {
  const defaultSchema = addNewPathsInSchema(new DefaultSchema(), options)
  const schema = new Schema(defaultSchema, { id: true, versionKey: false })
  ensureIndex(schema, options)
  return schema
}

/**
 * @author Welington Monteiro
 * @param { String } collectionName - collection name of model
 * @param { Object } options - options plugin schema
 * @return {*}
 */
function otherConnection (collectionName, options) {
  const connectionUri = get(options, 'connectionUri')
  const dbOptions = getOptionsVersionInstance(mongoose)
  const schema = initializeDefaultSchema(options)

  const otherConnection = mongoose.createConnection(connectionUri, dbOptions)
  return getOrAddNewInstanceModel(otherConnection, collectionName, schema)
}

/**
 * @author Welington Monteiro
 * @param { Object } options - options plugin schema
 * @param { schema } schema - schema default
 * @return {*}
 */
function ensureIndex (schema, options) {
  const indexes = get(options, 'indexes')
  const addCollectionPaths = get(options, 'addCollectionPaths', [])

  schema.index({ module: 1 })
  schema.index({ method: 1 })
  schema.index({ documentNumber: 1 })

  if (!isEmpty(indexes) && isArray(addCollectionPaths)) {
    indexes.map((idx) => schema.index(idx))
  }

  return schema
}

/**
 * @author Welington Monteiro
 * @param { Object } options - options plugin schema
 * @param { Object } schema - schema default
 * @return { Object } - return schema
 */
function addNewPathsInSchema (schema, options) {
  const addCollectionPaths = get(options, 'addCollectionPaths', [])

  if (isEmpty(addCollectionPaths) || !isArray(addCollectionPaths)) {
    return schema
  }

  addCollectionPaths.map(({ key, value, defaultValue }) => {
    const newField = {}
    if (TYPES[value]) {
      newField.type = TYPES[value]
    }
    if (defaultValue !== undefined) {
      newField.default = defaultValue
    }
    set(schema, `${key}`, newField)
  })
  return schema
}
