'use strict'
const { HistoryLogModel } = require('../../lib/historyLog-model')
const { keys, set } = require('lodash')

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
    it('Should initialize Model without options return model default model configuration', async () => {
      const HistoryModel = HistoryLogModel()

      expect(HistoryModel.modelName).to.be.eq('historyLogs')
      expect(HistoryModel.collection.name).to.be.eq('historyLogs')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    })
  })
  context('Initialize OPTIONS model', () => {
    it('Should initialize Model without options.indexes', async () => {
      const options = {
        indexes: [{ 'changes.label': 1 }],
        customCollectionName: 'name1'
      }
      const HistoryModel = HistoryLogModel(options)

      expect(HistoryModel.modelName).to.be.eq('name1')
      expect(HistoryModel.collection.name).to.be.eq('name1')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(4)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
      expect(HistoryModel.schema._indexes[3][0]).to.be.deep.eql({ 'changes.label': 1 })

    })
    it('Should initialize Model without options.addCollectionPaths', async () => {
      const options = {
        addCollectionPaths: [{ key: 'otherFields', value: 'String' }],
        customCollectionName: 'name2'
      }
      const HistoryModel = HistoryLogModel(options)
      const addFieldSchema = JSON.parse(JSON.stringify(defaultSchema))

      set(addFieldSchema, 'otherFields', 'String')

      expect(HistoryModel.modelName).to.be.eq('name2')
      expect(HistoryModel.collection.name).to.be.eq('name2')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(addFieldSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })
    })
    it('Should initialize Model without options.connectionUri', async () => {
      const options = {
        connectionUri: 'mongodb://localhost/other_database',
        customCollectionName: 'name3'
      }
      const HistoryModel = HistoryLogModel(options)

      expect(HistoryModel.modelName).to.be.eq('name3')
      expect(HistoryModel.collection.name).to.be.eq('name3')
      expect(HistoryModel.name).to.be.eq('model')
      expect(keys(HistoryModel.schema.obj)).to.be.deep.eql(keys(defaultSchema))

      expect(HistoryModel.schema._indexes.length).to.be.eq(3)
      expect(HistoryModel.schema._indexes[0][0]).to.be.deep.eql({ module: 1 })
      expect(HistoryModel.schema._indexes[1][0]).to.be.deep.eql({ method: 1 })
      expect(HistoryModel.schema._indexes[2][0]).to.be.deep.eql({ documentNumber: 1 })

      expect(HistoryModel.db._connectionString).to.be.deep.eql('mongodb://localhost/other_database')
    })
  })
})

