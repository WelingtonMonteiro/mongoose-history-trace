'use strict'

const { get, set, isEmpty, isArray } = require('lodash')
const mongoose = require('mongoose')
const TYPES = mongoose.Schema.Types
let historyLogModels = {}
const DEFAULT_COLLECTION_NAME = 'historyLogs'
const dbOptions = {
  autoIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}
/**
 * Create and cache a history mongoose model
 * @param { Object } [options]
 * @return {mongoose.Model} History Log Model
 */
module.exports.HistoryLogModel = function (options) {
  const indexes = get(options, 'indexes')
  const connectionUri = get(options, 'connectionUri')
  const collectionName = get(options, 'customCollectionName', DEFAULT_COLLECTION_NAME)
  const addCollectionPaths = get(options, 'addCollectionPaths', [])
  if (process.env.NODE_ENV === 'test') historyLogModels = {}

  const schemaObject = {
    documentNumber: { type: TYPES.String, required: true },
    action: { type: TYPES.String, required: true },
    method: { type: TYPES.String, required: true },
    user: { type: TYPES.Mixed, require: true },
    createdAt: { type: TYPES.Date, required: true, default: Date.now },
    module: { type: TYPES.String, require: true },
    changes: { type: [TYPES.Mixed], required: true }
  }

  if (!(collectionName in historyLogModels)) {
    if (!isEmpty(addCollectionPaths) && isArray(addCollectionPaths)) {
      addCollectionPaths.map(({ key, value, defaultValue }) => {
        const newField = {}
        if (TYPES[value]) {
          newField.type = TYPES[value]
        }
        if (defaultValue !== undefined) {
          newField.default = defaultValue
        }
        set(schemaObject, `${key}`, newField)
      })
    }

    const schema = new mongoose.Schema(schemaObject, { id: true, versionKey: false })

    schema.index({ module: 1 })
    schema.index({ method: 1 })
    schema.index({ documentNumber: 1 })

    if (!isEmpty(indexes) && isArray(addCollectionPaths)) {
      indexes.map((idx) => schema.index(idx))
    }

    if (connectionUri) {
      const otherConnection = require('mongoose').createConnection(connectionUri, dbOptions)
      historyLogModels[collectionName] = otherConnection.model(collectionName, schema, collectionName)
      return historyLogModels[collectionName]
    }
    if (mongoose.models[collectionName]) {
      historyLogModels[collectionName] = mongoose.models[collectionName]
    } else {
      historyLogModels[collectionName] = mongoose.model(collectionName, schema, collectionName)
    }
  }

  return historyLogModels[collectionName]
}
