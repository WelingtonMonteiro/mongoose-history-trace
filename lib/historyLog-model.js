'use strict'

const { get, set, isEmpty, isArray } = require('lodash')
const mongoose = require('mongoose')
const TYPES = mongoose.Schema.Types
const historyLogModels = {}
const DEFAULT_COLLECTION_NAME = 'historyLogs'
const db_options = {
    autoIndex: true,
    poolSize: 50,
    bufferMaxEntries: 0,
    keepAlive: 120,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
}
/**
 * Create and cache a historyLog mongoose model
 * @param { Object } [options]
 * @return {mongoose.Model} History Log Model
 */
module.exports.HistoryLogModel = function(options) {
    const indexes = get(options, 'indexes')
    const connectionUri = get(options, 'connectionUri')
    const collectionName = get(options, 'customCollectionName', DEFAULT_COLLECTION_NAME)
    const addCollectionPaths = get(options, 'addCollectionPaths', [])

    const schemaObject = {
        documentNumber: { type: String, required: true },
        action: { type: String, required: true },
        method: { type: String, required: true },
        historyLoggedUser: {
            fullName: { type: String },
            historyLogin: { type: String },
            role: { type: String },
        },
        createdAt: { type: Date, required: true, default: Date.now() },
        module: { type: String, require: true },
        changes: { type: [TYPES.Mixed], required: true },
    }

    if (!(collectionName in historyLogModels)) {
        if (!isEmpty(addCollectionPaths) && isArray(addCollectionPaths)) {
            addCollectionPaths.map(({ key, value, defaultValue }) => set(schemaObject, `${key}`, {
                type: (TYPES[value] || TYPES.Mixed),
                default: defaultValue,
            }))
        }

        const schema = new mongoose.Schema(schemaObject, { id: true, versionKey: false })

        schema.index({ module: 1 })
        schema.index({ method: 1 })
        schema.index({ documentNumber: 1 })

        if (!isEmpty(indexes) && isArray(addCollectionPaths)) {
            indexes.map((idx) => schema.index(idx))
        }

        if (connectionUri) {
            const otherConnection = require('mongoose').createConnection(connectionUri, db_options)
            historyLogModels[collectionName] = otherConnection.model(collectionName, schema, collectionName)
        } else {
            historyLogModels[collectionName] = mongoose.model(collectionName, schema, collectionName)
        }
    }

    return historyLogModels[collectionName]
}
