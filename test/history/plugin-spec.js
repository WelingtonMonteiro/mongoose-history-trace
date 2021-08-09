'use strict'
const mongooseHistoryTrace = require('../../lib/plugin')
const { HistoryLogModel } = require('../../lib/model')
const ObjectId = require('mongoose').Types.ObjectId
const mongoose = require('mongoose')
const Promise = require('bluebird')
const { toString, get, map, keys, isEmpty, merge } = require('lodash')

mongoose.Promise = global.Promise

describe('Mongoose-History-Trace', async () => {
  const dbOptions = getOptionsVersionInstance (mongoose)

  beforeEach(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', dbOptions)
  })
  afterEach(async () => {
    await removeAllCollections()
    await close()
  })
  context('Static methods', async () => {
    context('.getChangeDiffs', async () => {
      it('Should call without options and return changes array diffs', test(async () => {

        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel()
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform.to and return changes array diffs', test(async () => {
        const options = { changeTransform: { to: 'next' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(keys(changes[0])).to.be.include('next')
        expect(changes[0].next).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform.from and return changes array diffs', test(async () => {
        const options = { changeTransform: { from: 'preview' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(keys(changes[0])).to.be.include('preview')
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].preview).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform.path and return changes array diffs', test(async () => {
        const options = { changeTransform: { path: 'pathFrom' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(keys(changes[0])).to.be.include('pathFrom')
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].pathFrom).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform.ops and return changes array diffs', test(async () => {
        const options = { changeTransform: { ops: 'operation' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(keys(changes[0])).to.be.include('operation')
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].operation).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform.label and return changes array diffs', test(async () => {
        const options = { changeTransform: { label: 'field' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(keys(changes[0])).to.be.include('field')
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].field).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform is empty fields and return default fields in array diffs', test(async () => {
        const options = { changeTransform: { label: '', to: '', from: '', path: '', ops: '' } }
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(changes[0].to).to.be.eq('')
        expect(changes[0].from).to.be.eq('USER')
        expect(changes[0].path).to.be.eq('role')
        expect(changes[0].ops).to.be.eq('Deleted')
        expect(changes[0].label).to.be.eq('Role')
      }))
      it('Should call with options.changeTransform array object and return array diffs', test(async () => {
        const options = {
          changeTransform: {
            label: 'field',
            to: 'next',
            from: 'preview',
            path: 'paths',
            ops: 'action'
          }
        }
        const old = { oneArray: [{ onePath: { name: 'one' } }, { onePath: { name: 'two' } }, { onePath: { name: 'three' } }] }
        const current = { oneArray: [{ onePath: { name: 'one' } }, { onePath: { name: 'two' } }] }

        const UserModel = await getModel({ options })
        const changes = await UserModel.getChangeDiffs(old, current)

        expect(changes.length).to.be.eq(1)
        expect(changes[0].next).to.be.eq('')
        expect(changes[0].preview).to.be.eq('three')
        expect(changes[0].paths).to.be.eq('oneArray.onePath.name')
        expect(changes[0].action).to.be.eq('Deleted')
        expect(changes[0].field).to.be.eq('Name')
      }))
    })
    context('.createHistory', async () => {
      it('Should call without options and user not saved history', test(async () => {

        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }

        const UserModel = await getModel({})
        await UserModel.createHistory({ old, current })

        const History = await getHistoryModel()
        const result = await History.find().lean()

        expect(result.length).to.be.eq(0)
      }))
      it('Should call with options and user and save history', test(async () => {
        const _id = toString(new ObjectId())
        const options = { changeTransform: { to: 'next' }, userPaths: ['name', 'email'], isAuthenticated: true }
        const old = { _id, name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { _id, name: 'Jhon', email: 'john@email.com' }
        const loggedUser = { name: 'Jhon', email: 'john@email.com' }
        const method = 'updated'

        const UserModel = await getModel({ options })
        await UserModel.createHistory({ old, current, loggedUser, method })

        const History = await getHistoryModel()
        const result = await History.find().lean()

        expect(result.length).to.be.eq(1)
        expect(result[0].changes.length).to.be.eq(1)
        expect(result[0].changes[0].next).to.be.eq('')
        expect(result[0].changes[0].from).to.be.eq('USER')
        expect(result[0].changes[0].path).to.be.eq('role')
        expect(result[0].changes[0].ops).to.be.eq('Deleted')
        expect(result[0].changes[0].label).to.be.eq('Role')
        expect(result[0].documentNumber).to.be.eq(_id)
        expect(result[0].method).to.be.eq('updated')
        expect(result[0].action).to.be.eq('Edited Document')
        expect(result[0].module).to.be.eq('User')
        expect(result[0].user).to.deep.eql(loggedUser)
      }))
      it('Should call with options and without user and not save history', test(async () => {
        const _id = toString(new ObjectId())
        const options = { changeTransform: { to: 'next' }, userPaths: ['name', 'email'], isAuthenticated: true }
        const old = { _id, name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { _id, name: 'Jhon', email: 'john@email.com' }
        const method = 'updated'

        const UserModel = await getModel({ options })
        await UserModel.createHistory({ old, current, method })

        const History = await getHistoryModel()
        const result = await History.find().lean()

        expect(result.length).to.be.eq(0)

      }))
    })
  })
  context('Mongoose Methods', async () => {
    context('.CREATE', async () => {
      it('Should call method .create() without options.userPath and loggedUser and not Saved History', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options, loggedUser)

        expect(history.length).to.be.eq(0)

      }))
      it('Should call method .create() with    options.userPaths and loggedUser and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true, userPaths: ['name', 'email', 'role'] }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options, loggedUser)
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

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
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
        const schema = { name: String, email: String, phone: String }
        const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: true }

        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})
        const { history } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        delete history._id

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.INSERT_MANY', async () => {
      it('Should call method .insertMany() without options.userPath and loggedUser and not Saved History', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = [
          { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          { _id: toString(new ObjectId()), name: 'Other Name 2', email: 'johndoe@email.com', phone: '8888-88888' }
        ]
        const options = { isAuthenticated: true }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('insertMany', schema, mod, null, options, loggedUser)

        expect(history.length).to.be.eq(0)

      }))
      it('Should call method .insertMany() with    options.userPaths and loggedUser and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = [
          { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          { _id: toString(new ObjectId()), name: 'Other Name 2', email: 'johndoe@email.com', phone: '8888-88888' }
        ]
        const options = { isAuthenticated: true, userPaths: ['name', 'email', 'role'] }
        const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('insertMany', schema, mod, null, options, loggedUser)
        delete history._id

        expect(history.length).to.be.eq(2)
        expect(history[0].changes.length).to.be.eq(4)

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

        expect(history[0].changes[3].label).to.be.eq('V')
        expect(history[0].changes[3].ops).to.be.eq('Created')
        expect(history[0].changes[3].path).to.be.eq('__v')
        expect(history[0].changes[3].from).to.be.eq('')
        expect(history[0].changes[3].to).to.be.eq(0)

        expect(history[0].action).to.be.eq('Created Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('created')
        expect(history[0].user).to.deep.eql(loggedUser)
        expect(history[0].documentNumber).to.be.eq(mod[0]._id)

        expect(history[1].changes.length).to.be.eq(4)
        expect(history[1].changes[0].label).to.be.eq('Name')
        expect(history[1].changes[0].ops).to.be.eq('Created')
        expect(history[1].changes[0].path).to.be.eq('name')
        expect(history[1].changes[0].from).to.be.eq('')
        expect(history[1].changes[0].to).to.be.eq('Other Name 2')

        expect(history[1].changes[1].label).to.be.eq('Email')
        expect(history[1].changes[1].ops).to.be.eq('Created')
        expect(history[1].changes[1].path).to.be.eq('email')
        expect(history[1].changes[1].from).to.be.eq('')
        expect(history[1].changes[1].to).to.be.eq('johndoe@email.com')

        expect(history[1].changes[2].label).to.be.eq('Phone')
        expect(history[1].changes[2].ops).to.be.eq('Created')
        expect(history[1].changes[2].path).to.be.eq('phone')
        expect(history[1].changes[2].from).to.be.eq('')
        expect(history[1].changes[2].to).to.be.eq('8888-88888')

        expect(history[1].changes[3].label).to.be.eq('V')
        expect(history[1].changes[3].ops).to.be.eq('Created')
        expect(history[1].changes[3].path).to.be.eq('__v')
        expect(history[1].changes[3].from).to.be.eq('')
        expect(history[1].changes[3].to).to.be.eq(0)

        expect(history[1].action).to.be.eq('Created Document')
        expect(history[1].module).to.be.eq('User')
        expect(history[1].method).to.be.eq('created')
        expect(history[1].user).to.deep.eql(loggedUser)
        expect(history[1].documentNumber).to.be.eq(mod[1]._id)
      }))
      it('Should call method .insertMany() one document and save history created', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = [
          { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
        ]
        const options = { isAuthenticated: false }

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('insertMany', schema, mod, null, options)
        delete history._id

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

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

        expect(history[0].changes[3].label).to.be.eq('V')
        expect(history[0].changes[3].ops).to.be.eq('Created')
        expect(history[0].changes[3].path).to.be.eq('__v')
        expect(history[0].changes[3].from).to.be.eq('')
        expect(history[0].changes[3].to).to.be.eq(0)

        expect(history[0].action).to.be.eq('Created Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('created')
        expect(history[0].documentNumber).to.be.eq(mod[0]._id)
      }))
      it('Should call method .insertMany() one document without logged user and not save history', test(async () => {
        const schema = { name: String, email: String, phone: String }
        const mod = [
          { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
        ]
        const options = { isAuthenticated: true }

        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})
        const { history } = await _helperCreateOrUpdateOrRemoveDocument('insertMany', schema, mod, null, options)
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

        const { result } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)

        let HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})
        result.name = 'Other Name'
        await result.save()

        HistoryModel = await getHistoryModel()
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

        const { result } = await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)

        let HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})
        await result.save()

        HistoryModel = await getHistoryModel()
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('updateOne', schema, { name: 'John Doe' }, { _id }, options)

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.UPDATE_MANY', async () => {
      it('Should call method .updateMany() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('updateMany', schema, { name: 'Joe Doe' }, { _id }, options)

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
      it('Should call method .updateMany() one document without diff and not save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('updateMany', schema, { name: 'John Doe' }, { _id }, options)

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.FIND_ONE_AND_REPLACE', async () => {
      it('Should call method .findOneAndReplace() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndReplace', schema, { name: 'Joe Doe' }, { _id }, options)

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
      it('Should call method .findOneAndReplace() one document without diff and not save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create',schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndReplace', schema, { name: 'John Doe' }, { _id }, options)

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.REPLACE_ONE', async () => {
      it('Should call method .replaceOne() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('replaceOne', schema, { name: 'Joe Doe' }, { _id }, options)

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
      it('Should call method .replaceOne() one document without diff and not save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('replaceOne', schema, { name: 'John Doe' }, { _id }, options)

        expect(history.length).to.be.eq(0)
      }))
    })
    context('.UPDATE', async () => {
      it('Should call method .update() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('deleteOne', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_BY_ID_AND_REMOVE', async () => {
      it('Should call method .findByIdAndRemove() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findByIdAndRemove', schema, null, _id, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_BY_ID_AND_DELETE', async () => {
      it('Should call method .findByIdAndDelete() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findByIdAndDelete', schema, null, _id, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
        })

        expect(history[0].action).to.be.eq('Removed Document')
        expect(history[0].module).to.be.eq('User')
        expect(history[0].method).to.be.eq('deleted')
        expect(history[0].documentNumber).to.be.eq(_id)
      }))
    })
    context('.FIND_ONE_AND_DELETE', async () => {
      it('Should call method .findOneAndDelete() one document and save history created', test(async () => {
        const _id = toString(new ObjectId())
        const schema = { name: String, email: String, phone: String }
        const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
        const options = { isAuthenticated: false }

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndDelete', schema, null, _id, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('deleteMany', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('remove', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
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

        await _helperCreateOrUpdateOrRemoveDocument('create', schema, mod, null, options)
        const HistoryModel = await getHistoryModel()
        await HistoryModel.deleteMany({})

        const { history } = await _helperCreateOrUpdateOrRemoveDocument('findOneAndRemove', schema, null, { _id }, options)

        expect(history.length).to.be.eq(1)
        expect(history[0].changes.length).to.be.eq(4)

        expect(history[0].changes[0]).to.be.deep.eql({
          'to': '', 'path': 'name', 'from': 'John Doe', 'ops': 'Deleted', 'label': 'Name', 'index': null, isArray: false
        })
        expect(history[0].changes[1]).to.be.deep.eql({
          'to': '', 'path': 'email', 'from': 'john@email.com', 'ops': 'Deleted', 'label': 'Email', 'index': null, isArray: false
        })
        expect(history[0].changes[2]).to.be.deep.eql({
          'to': '', 'path': 'phone', 'from': '999-99999', 'ops': 'Deleted', 'label': 'Phone', 'index': null, isArray: false
        })
        expect(history[0].changes[3]).to.be.deep.eql({
          'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
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

  const UserModel = await getModel({ options, schema, loggedUser })

  if (method === 'save') {
    const user = new UserModel(mod || defaultMod)
    result = await user.save()
  }
  if (/insertMany|create/.test(method)) {
    result = await UserModel[method](mod)
  }
  if (/deleteOne|remove|deleteMany|findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/.test(method)) {
    result = await UserModel[`${method}`](query)
  }
  if (/update|updateOne|findOneAndUpdate|findByIdAndUpdate|updateMany/.test(method)) {
    delete mod._id
    result = await UserModel[`${method}`](query, { $set: mod }, { new: true })
  }
  if (/findOneAndReplace|replaceOne/.test(method)) {
    delete mod._id
    result = await UserModel[`${method}`](query, mod, { new: true })
  }

  const HistoryModel = await getHistoryModel()
  let queryHistory = {}
  const documentNumber = get(result, '_id', get(query, '_id'))
  if (documentNumber) queryHistory = { documentNumber }
  if (Array.isArray(result) && !isEmpty(result)) {
    const $in = []
    result.forEach(item => $in.push(item._id))
    queryHistory = { documentNumber: { $in } }
  }
  const history = await HistoryModel.find(queryHistory).lean()
  return { result, history }
}

async function getHistoryModel () {
  await deleteModel('historyLogs')
  return HistoryLogModel()
}

/**
 *
 * @param { Object }[params]
 * @param { Object }[params.options]
 * @param { Object }[params.schema]
 * @param { Object }[params.loggedUser]
 * @param { String }[params.modelName]
 * @return {Promise<*>}
 */
async function getModel (params = {}) {
  const { options = {}, schema, loggedUser = {}, modelName = 'User' } = params
  await deleteModel(modelName)

  const defaultSchema = { name: String, email: String, phone: String }
  const Model = new mongoose.Schema(schema || defaultSchema)
  let InstanceModel = {}

  Model.plugin(mongooseHistoryTrace, options)
  if (mongoose.models[modelName]) {
    await Promise.map(mongoose.models[modelName].schema.plugins, async (item) => {
      map(options, (value, key) => {
        if (item.opts[key]) {
          item.opts[key] = value
        }
      })
    })
    InstanceModel = mongoose.models[modelName]
  } else {
    InstanceModel = mongoose.model(modelName, Model, modelName)
  }

  InstanceModel.addLoggedUser(loggedUser)

  return InstanceModel
}

async function close () {
  await mongoose.connection.close()
  await mongoose.disconnect()
}

async function removeAllCollections () {
  const History = await getHistoryModel()
  await History.deleteMany({})
  await mongoose.connection.db.dropDatabase()
}

function getOptionsVersionInstance (mongooseInstance) {
  const version = parseInt(mongooseInstance.version)
  if (version < 5) {
    return merge({}, { useMongoClient: true })
  }
  return merge({}, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, autoIndex: true })
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
