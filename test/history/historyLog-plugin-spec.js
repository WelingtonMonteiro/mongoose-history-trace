'use strict'
const mongooseHistoryTrace = require('../../lib/historyLog-plugin')
const { HistoryLogModel } = require('../../lib/historyLog-model')
const ObjectId = require('mongoose').Types.ObjectId
const mongoose = require('mongoose')
const Promise = require('bluebird')
const { toString, get, map } = require('lodash')
const dbOptions = {
  autoIndex: true,
  poolSize: 50,
  bufferMaxEntries: 0,
  keepAlive: 120,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}
let HistoryModel = HistoryLogModel()

describe('Mongoose-History-Trace', async () => {
  beforeEach(async () => {
    await mongoose.connect('mongodb://localhost/test', dbOptions)
  })
  afterEach(async () => {
    await removeAllCollections()
    await close()
  })
  context('Mongoose Methods OPTIONS', async () => {
    context('.CREATE', async () => {
      it('Should call method .create() without options.userPath and loggedUser and not Saved Hisotry', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options, loggedUser)

        expect(history.length).to.be.eq(0)

      }))
      it('Should call method .create() with    options.userPaths and loggedUser and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true, userPaths: ['name', 'email', 'role'] }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options, loggedUser)
        delete history._id

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(3)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Created')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('')
        expect(history[0].changes[0].to).to.be.eq('Other Name')

        expect(history[0].changes[1].label).to.be.eq('Email')
        expect(history[0].changes[1].ops).to.be.eq('Created')
        expect(history[0].changes[1].path).to.be.eq('email')
        expect(history[0].changes[1].from).to.be.eq('')
        expect(history[0].changes[1].to).to.be.eq('john@email.com')

        expect(history[0].changes[2].label).to.be.eq('Phone')
        expect(history[0].changes[2].ops).to.be.eq('Created')
        expect(history[0].changes[2].path).to.be.eq('phone')
        expect(history[0].changes[2].from).to.be.eq('')
        expect(history[0].changes[2].to).to.be.eq('999-99999')

        expect(history[0].action).to.be.eq('Created Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('created')
        expect(history[0].user).to.deep.eql(loggedUser)
        expect(history[0].documentNumber).to.be.eq(mod._id)
      }))
      it('Should call method .create() one document and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        delete history._id

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(3)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Created')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('')
        expect(history[0].changes[0].to).to.be.eq('John Doe')

        expect(history[0].changes[1].label).to.be.eq('Email')
        expect(history[0].changes[1].ops).to.be.eq('Created')
        expect(history[0].changes[1].path).to.be.eq('email')
        expect(history[0].changes[1].from).to.be.eq('')
        expect(history[0].changes[1].to).to.be.eq('john@email.com')

        expect(history[0].changes[2].label).to.be.eq('Phone')
        expect(history[0].changes[2].ops).to.be.eq('Created')
        expect(history[0].changes[2].path).to.be.eq('phone')
        expect(history[0].changes[2].from).to.be.eq('')
        expect(history[0].changes[2].to).to.be.eq('999-99999')

        expect(history[0].action).to.be.eq('Created Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('created')
        expect(history[0].documentNumber).to.be.eq(mod._id)
      }))
      it('Should call method .create() one document without logged user and not save history', test(async () => {
        //TODO: test intermittent, only pass. Verify why!

        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true }
        const HistoryModel = await HistoryLogModel()
        await HistoryModel.deleteMany({})
        const { history } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        delete history._id

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.SAVE', async () => {
      it('Should call method .save() one document and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('save', schema, mod, null, options)
        delete history._id

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(3)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Created')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('')
        expect(history[0].changes[0].to).to.be.eq('John Doe')

        expect(history[0].changes[1].label).to.be.eq('Email')
        expect(history[0].changes[1].ops).to.be.eq('Created')
        expect(history[0].changes[1].path).to.be.eq('email')
        expect(history[0].changes[1].from).to.be.eq('')
        expect(history[0].changes[1].to).to.be.eq('john@email.com')

        expect(history[0].changes[2].label).to.be.eq('Phone')
        expect(history[0].changes[2].ops).to.be.eq('Created')
        expect(history[0].changes[2].path).to.be.eq('phone')
        expect(history[0].changes[2].from).to.be.eq('')
        expect(history[0].changes[2].to).to.be.eq('999-99999')

        expect(history[0].action).to.be.eq('Created Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('created')
        expect(history[0].documentNumber).to.be.eq(mod._id)
      }))
      it('Should call method .saveDocument() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        const { result } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        let HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})
        result.name = 'Other Name'
        await result.save()

        HistoryModel = HistoryLogModel()
        const history = await HistoryModel.find({}).lean()

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(1)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Edited')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('John Doe')
        expect(history[0].changes[0].to).to.be.eq('Other Name')

        expect(history[0].action).to.be.eq('Edited Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('updated')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
      it('Should call method .saveDocument() one document without diffs and not save history', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        const { result } = await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        let HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})
        await result.save()

        HistoryModel = HistoryLogModel()
        const history = await HistoryModel.find({}).lean()

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.UPDATE_ONE', async () => {
      it('Should call method .updateOne() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('updateOne', schema, { name: 'Joe Doe' }, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(1)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Edited')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('John Doe')
        expect(history[0].changes[0].to).to.be.eq('Joe Doe')

        expect(history[0].action).to.be.eq('Edited Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('updated')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
      it('Should call method .updateOne() one document without diff and not save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('John Doe', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('updateOne', schema, { name: 'Joe Doe' }, { _id }, options)

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.UPDATE', async () => {
      it('Should call method .update() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('update', schema, { name: 'Joe Doe' }, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(1)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Edited')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('John Doe')
        expect(history[0].changes[0].to).to.be.eq('Joe Doe')

        expect(history[0].action).to.be.eq('Edited Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('updated')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_ONE_AND_UPDATE', async () => {
      it('Should call method .findOneAndUpdate() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndUpdate', schema, { name: 'Joe Doe' }, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(1)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Edited')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('John Doe')
        expect(history[0].changes[0].to).to.be.eq('Joe Doe')

        expect(history[0].action).to.be.eq('Edited Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('updated')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_BY_ID_AND_UPDATE', async () => {
      it('Should call method .findByIdAndUpdate() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findByIdAndUpdate', schema, { name: 'Joe Doe' }, _id, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(1)

        expect(history[0].changes[0].label).to.be.eq('Name')
        expect(history[0].changes[0].ops).to.be.eq('Edited')
        expect(history[0].changes[0].path).to.be.eq('name')
        expect(history[0].changes[0].from).to.be.eq('John Doe')
        expect(history[0].changes[0].to).to.be.eq('Joe Doe')

        expect(history[0].action).to.be.eq('Edited Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('updated')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.DELETE_ONE', async () => {
      it('Should call method .deleteOne() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('deleteOne', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name'
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email'
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone'
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V'
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.DELETE_MANY', async () => {
      it('Should call method .deleteMany() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('deleteMany', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name'
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email'
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone'
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V'
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.REMOVE', async () => {
      it('Should call method .remove() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('remove', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name'
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email'
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone'
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V'
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_ONE_AND_REMOVE', async () => {
      it('Should call method .findOneAndRemove() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('created', schema, mod, null, options)
        const HistoryModel = HistoryLogModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndRemove', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name'
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email'
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone'
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V'
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
  })
})

/**
 *
 * @param method
 * @param schema
 * @param mod
 * @param query
 * @param [options]
 * @param loggedUser
 * @return {Promise<{result: {}, history: *}>}
 * @private
 */
async function _helperCreateOrUpdateOrRemoveDocument (method, schema, mod, query, options = {}, loggedUser = {}) {
  let result = {}
  const defaultMod = { name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

  const UserModel = await getModel(options, schema, loggedUser)

  if (method === 'save') {
    const user = new UserModel(mod || defaultMod)
    result = await user.save()
  }
  if (method === 'created') {
    result = await UserModel.create(mod)
  }
  if (/deleteOne|remove|deleteMany|findOneAndRemove/.test(method)) {
    result = await UserModel[`${method}`](query)
  }
  if (/update|updateOne|findOneAndUpdate|findByIdAndUpdate/.test(method)) {
    delete mod._id
    result = await UserModel[`${method}`](query, { $set: mod }, { new: true })
  }
  const HistoryModel = HistoryLogModel()
  const history = await HistoryModel.find({ documentNumber: get(result, '_id', get(query, '_id')) }).lean()
  return { result, history }
}

async function getModel (options, schema, loggedUser = {}) {
  const defaultSchema = { name: String, email: String, phone: String }
  const User = new mongoose.Schema(schema || defaultSchema)
  let UserModel = {}

  User.plugin(mongooseHistoryTrace, options)

  if (mongoose.models.User) {
    await Promise.map(mongoose.models.User.schema.plugins, async (item) => {
      map(options, (value, key) => {
        if (item.opts[key]) {
          item.opts[key] = value
        }
      })
    })
    UserModel = mongoose.models.User
  } else {
    UserModel = mongoose.model('User', User, 'User')
  }

  UserModel.addLoggedUser(loggedUser)

  return UserModel
}

async function close () {
  await mongoose.connection.db.dropDatabase()
  await mongoose.connection.close()
  await mongoose.disconnect()
  mongoose.models = {}
  mongoose.modelSchemas = {}
}

async function removeAllCollections () {
  await Promise.map(Object.keys(mongoose.connection.collections), async (collectionName) => {
    const collection = mongoose.connection.collections[collectionName]
    await collection.deleteMany()
  })

  await Promise.map(Object.keys(mongoose.connection.models), async (modelName) => {
    mongoose.connection.models[modelName] = {}
  })
  await HistoryModel.deleteMany({})

}

