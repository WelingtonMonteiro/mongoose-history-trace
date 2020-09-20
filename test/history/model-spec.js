'use strict'
const { HistoryLogModel } = require('../../lib/model')
const { keys, set, get } = require('lodash')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

describe('class HistoryModel', () => {
  const defaultSchema = {
    'documentNumber': { 'required': true },
    'action': { 'required': true },
    'method': { 'required': true },
    'user': { 'require': true },
    'createdAt': { 'required': true, 'default': Date.now() },
    'module': { 'require': true },
    'changes': { 'type': [], 'required': true }
  }

  context('Initialize default model', () => {
    it('Should initialize Model without options return model default model configuration', test(async () => {
      const HistoryModel = await getHistoryModel()

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    }))
  })
  context('Initialize OPTIONS model', () => {
    it('Should initialize Model with options.indexes', test(async () => {
      const options = {
        indexes: [{ 'changes.label': 1 }]
      }
      const HistoryModel = await getHistoryModel(options)

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(4)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
      expect(HistoryModel.schema._indexes[3][0]).to.be.deep.eql({ 'changes.label': 1 })
    }))
    it('Should initialize Model with options.addCollectionPaths', test(async () => {
      const options = {
        addCollectionPaths: [{ key: 'otherFields', value: 'String' }]
      }

      const HistoryModel = await getHistoryModel(options)
      const addFieldSchema = JSON.parse(JSON.stringify(defaultSchema))

      set(addFieldSchema, 'otherFields', 'String')

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(addFieldSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    }))
    it('Should initialize Model with options.addCollectionPaths and options.defaultValue', test(async () => {
      const options = {
        addCollectionPaths: [{ key: 'otherFields', value: 'String', defaultValue: '' }],
        // customCollectionName: 'name3'
      }
      const HistoryModel = await getHistoryModel(options)
      const addFieldSchema = JSON.parse(JSON.stringify(defaultSchema))

      set(addFieldSchema, 'otherFields', 'String')

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(addFieldSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    }))
    it('Should initialize Model with options.addCollectionPaths without type value', test(async () => {
      const options = {
        addCollectionPaths: [{ key: 'otherFields' }],
      }

      const HistoryModel = await getHistoryModel(options)
      const addFieldSchema = JSON.parse(JSON.stringify(defaultSchema))

      set(addFieldSchema, 'otherFields', 'String')

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(addFieldSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    }))
    it('Should initialize Model without options.connectionUri', test(async () => {
      const options = {
        connectionUri: 'mongodb://localhost/other_database',
      }

      const HistoryModel = await getHistoryModel(options)

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })

      expect(HistoryModel.db.name).to.be.eq('other_database')
    }))
  })
})

async function getHistoryModel (options) {
  await deleteModel('historyLogs')
  return HistoryLogModel(options)
}

async function deleteModel (name) {
  if (typeof name === 'string') {
    const model = mongoose.models[name]
    if (model == null) return
    const collectionName = get(model, 'collection.name')
    if (!collectionName) return
    if (mongoose.models) delete mongoose.models[`${name}`]
    if (mongoose.collections) delete mongoose.collections[`${collectionName}`]
    if (mongoose.modelSchemas) delete mongoose.modelSchemas[`${name}`]
    if (mongoose.connections.length) {
      mongoose.connections.map(item => {
        if (item.models) delete item.models[`${name}`]
        if (item.base && item.base.modelSchemas) delete item.base.modelSchemas[`${name}`]
        if (item.collections) delete item.collections[`${collectionName}`]
      })
    }
  }
  if (name instanceof RegExp) {
    const pattern = name
    const names = mongoose.modelNames()
    for (const name of names) {
      if (pattern.test(name)) {
        await deleteModel(name)
      }
    }
  }
}

