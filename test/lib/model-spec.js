const mongoose = require('mongoose')
const { HistoryLogModel } = require('../../lib/model')
const { set, keys, merge } = require('lodash')

describe('Mongoose-History-Trace::model', async () => {
  const dbOptions = getOptionsVersionInstance(mongoose)
  let mongooseConnection, Model, HistoryModel = null
  let clientMongoose
  const defaultSchema = {
    'documentNumber': { 'required': true },
    'action': { 'required': true },
    'method': { 'required': true },
    'user': { 'require': true },
    'createdAt': { 'required': true, 'default': Date.now() },
    'module': { 'require': true },
    'changes': { 'type': [], 'required': true }
  }

  beforeEach(async () => {
    clientMongoose = new mongoose.Mongoose()
    mongooseConnection = await clientMongoose.connect('mongodb://localhost:27017/test', dbOptions)
  })
  afterEach(async () => {
    // await removeAllData({ Model, HistoryModel })
    mongooseConnection = null
    clientMongoose = null
  })

  context('Initialize default model', () => {
    it('Should initialize Model without connection, not return model', test(async () => {
      HistoryModel = await HistoryLogModel()

      expect(HistoryModel).to.be.eq(undefined)
    }))
    it('Should initialize Model without options return model default model configuration', test(async () => {
      HistoryModel = await HistoryLogModel(mongooseConnection)

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
      const HistoryModel = await HistoryLogModel(mongooseConnection, options)

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

      const HistoryModel = await HistoryLogModel(mongooseConnection, options)
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
      const HistoryModel = await HistoryLogModel(mongooseConnection, options)
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

      const HistoryModel = await HistoryLogModel(mongooseConnection, options)
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
      clientMongoose = new mongoose.Mongoose()
      mongooseConnection = await clientMongoose.connect('mongodb://localhost:27017/other_database', dbOptions)

      const HistoryModel = await HistoryLogModel(mongooseConnection)

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

  async function removeAllData ({ Model, HistoryModel }) {
    if (Model) await Model.deleteMany()
    if (HistoryModel) await HistoryModel.deleteMany()
  }

  function getOptionsVersionInstance (mongooseInstance) {
    const version = parseInt(mongooseInstance.version)
    if (version < 5) {
      return merge({}, { useMongoClient: true })
    }
    if (version > 5 && version < 6 ) {
      return merge({}, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        autoIndex: true,
        useCreateIndex: true
      })
    }

    return merge({}, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  }
})
