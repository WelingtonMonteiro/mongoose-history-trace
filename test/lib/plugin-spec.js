const mongoose = require('mongoose')
const mongooseHistoryTrace = require('../../lib/plugin')
const { HistoryLogModel } = require('../../lib/model')
const { toString, get, result: execute, keys, isEmpty, merge } = require('lodash')
const ObjectId = require('mongoose').Types.ObjectId

describe.only('Mongoose-History-Trace::plugin', async () => {
  const dbOptions = getOptionsVersionInstance(mongoose)
  let mongooseConnection, Model, HistoryModel = null
  const modelName = 'User'
  let clientMongoose

  beforeEach(async () => {
    clientMongoose = new mongoose.Mongoose()
    mongooseConnection = await clientMongoose.connect('mongodb://localhost:27017/test', dbOptions)
  })
  afterEach(async () => {
    await removeAllData({ Model, HistoryModel })
    mongooseConnection = null
    clientMongoose = null
  })

  context('PLugin::Static methods', async () => {
    context('.getChangeDiffs', async () => {
      it('Should call without options and return changes array diffs', test(async () => {
        const old = { name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { name: 'Jhon', email: 'john@email.com' }
        const options = {}
        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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
        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })

        const changes = await Model.getChangeDiffs(old, current)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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
        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        const changes = await Model.getChangeDiffs(old, current)

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
        const _id = toString(new ObjectId())
        const options = { isAuthenticated: true }
        const old = { _id, name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { _id, name: 'Jhon', email: 'john@email.com' }

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        await Model.createHistory({ old, current })

        const result = await getHistory({ documentNumber: _id }, options)

        expect(result.length).to.be.eq(0)
      }))
      it('Should call with options and user and save history and not strict schema and not save', test(async () => {
        const _id = toString(new ObjectId())
        const options = { changeTransform: { to: 'next' }, userPaths: ['name', 'email'], isAuthenticated: true }
        const old = { _id, name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { _id, name: 'Jhon', email: 'john@email.com' }
        const loggedUser = { name: 'Jhon', email: 'john@email.com' }
        const method = 'updated'

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        await Model.createHistory({ old, current, loggedUser, method })

        const result = await getHistory({ documentNumber: _id }, options)

        expect(result.length).to.be.eq(1)
      }))
      it('Should call with options and user and save history with strict schema', test(async () => {
        const _id = toString(new ObjectId())
        const options = {
          mongooseConnection, changeTransform: { to: 'next' },
          userPaths: ['name', 'email'], addCollectionPaths: [{ key: 'role', value: 'String' }]
        }
        const old = { _id, name: 'Jhon', email: 'john@email.com', role: 'USER' }
        const current = { _id, name: 'Jhon', email: 'john@email.com' }
        const loggedUser = { name: 'Jhon', email: 'john@email.com' }
        const method = 'updated'

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        await Model.createHistory({ old, current, loggedUser, method })

        const result = await getHistory({ documentNumber: _id }, options)

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

        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema, options })
        await Model.createHistory({ old, current, method })

        const result = await getHistory({ documentNumber: _id }, options)

        expect(result.length).to.be.eq(0)
      }))
    })
    context('.addLoggedUser', async () => {
      it('Should call method and set _loggedUser in session schema', test(async () => {
        const loggedUser = { name: 'Jhon', email: 'john@email.com' }
        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema })
        await Model.addLoggedUser(loggedUser)

        expect(Model.schema._loggedUser).to.be.eql(loggedUser)
      }))
      it('Should call method without loggedUser and not set _loggedUser in session schema', test(async () => {
        const schema = { name: String, email: String, role: String }
        Model = await initModel({ schema })
        await Model.addLoggedUser()

        expect(Model.schema._loggedUser).to.be.eql(undefined)
      }))
    })
  })
  context('Plugin::options', async () => {
    context('Plugin::options others', async () => {
      context('.CREATE', async () => {
        it('Should call method .create() without options, return Saved History', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const options = {}
          Model = await initModel({ schema, options })

          let result = await Model.create({
            _id: new ObjectId(),
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })
          result = execute(result, 'toObject', result)

          expect(result).to.has.property('_id').equal(result._id)
          expect(result).to.be.property('name').equal('Other Name')
          expect(result).to.be.property('email').equal('john@email.com')
          expect(result).to.be.property('phone').equal('999-99999')

          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(result._id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
        it('Should call method .create() with isAuthenticated=true and without loggedUser, not Saved History', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const options = { isAuthenticated: true }
          Model = await initModel({ schema, options })

          let result = await Model.create({
            _id: new ObjectId(),
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })
          result = execute(result, 'toObject', result)

          expect(result).to.has.property('_id').equal(result._id)
          expect(result).to.be.property('name').equal('Other Name')
          expect(result).to.be.property('email').equal('john@email.com')
          expect(result).to.be.property('phone').equal('999-99999')

          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
        it('Should call method .create() with    options.userPaths and loggedUser and save history created', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const mod = { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: true, userPaths: ['name', 'email', 'role'] }
          const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

          Model = await initModel({ schema, options })
          Model.addLoggedUser(loggedUser)
          let result = await Model.create(mod)
          result = execute(result, 'toObject', result)

          const history = await getHistory({ documentNumber: result._id })

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
        it('Should call method .create() and save history created', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })
          let result = await Model.create(mod)
          result = execute(result, 'toObject', result)

          const history = await getHistory({ documentNumber: result._id })

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
        it('Should call method .create() without logged user and not save history', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const mod = { _id: toString(new ObjectId()), name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: true }

          Model = await initModel({ schema, options })
          let result = await Model.create(mod)
          result = execute(result, 'toObject', result)
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
        it('Should call method .create() without connection and not save history', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const options = { mongooseConnection: null, isAuthenticated: true }

          Model = await initModel({ schema, options })

          expect(Model).not.be.eq(null)
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

          Model = await initModel({ schema, options })
          Model.addLoggedUser(loggedUser)

          let result = await Model.insertMany(mod)
          result = execute(result, 'toObject', result)
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)

        }))
        it('Should call method .insertMany() with    options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const schema = { name: String, email: String, phone: String }
          const mod = [
            { _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]
          const options = { isAuthenticated: true, userPaths: ['name', 'email', 'role'] }
          const loggedUser = { name: 'Jhon', email: 'john@email.com', role: 'USER' }

          Model = await initModel({ schema, options })
          Model.addLoggedUser(loggedUser)

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id }, options)

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
          expect(history[0].user).to.deep.eql(loggedUser)
          expect(history[0].documentNumber).to.be.eq(mod[0]._id)
        }))
        it('Should call method .insertMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = [
            { _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.insertMany(mod)
          result = execute(result, 'toObject', result)
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .insertMany() without logged user and not save history', test(async () => {
          const schema = { name: String, email: String, phone: String }
          const mod = [
            { _id: toString(new ObjectId()), name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]
          const options = { isAuthenticated: true }

          Model = await initModel({ schema, options })

          let result = await Model.insertMany(mod)
          result = execute(result, 'toObject', result)
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let model = new Model(mod)
          let result = model.save()
          result = execute(result, 'toObject', result)
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .saveDocument() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          result.name = 'Other Name'
          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .saveDocument() without diffs and not save history', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

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
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: result._id })

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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { mongooseConnection, isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: result._id })
          await HistoryModel.deleteMany({})

          result = await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: result._id })

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          const result = await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { mongooseConnection, isAuthenticated: false }

          Model = await initModel({ schema, options })

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          const result = await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { isAuthenticated: false }

          Model = await initModel({ schema, options })

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { mongooseConnection, isAuthenticated: false }

          Model = await initModel({ schema, options })

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const schema = { name: String, email: String, phone: String }
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }
          const options = { mongooseConnection, isAuthenticated: false }

          Model = await initModel({ schema, options })

          let result = await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          result = await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
    context('Plugin::options.label', async () => {
      const options = {}
      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String, _label_: 'otherName' },
          email: { type: String, _label_: 'otherEmail' },
          phone: { type: String, _label_: 'otherPhone' }
        }
        Model = await initModel({ schema })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.label, return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('otherName')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('otherEmail')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('otherPhone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const mod = [
            { _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id })

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Created')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('')
          expect(history[0].changes[0].to).to.be.eq('Other Name')

          expect(history[0].changes[1].label).to.be.eq('otherEmail')
          expect(history[0].changes[1].ops).to.be.eq('Created')
          expect(history[0].changes[1].path).to.be.eq('email')
          expect(history[0].changes[1].from).to.be.eq('')
          expect(history[0].changes[1].to).to.be.eq('john@email.com')

          expect(history[0].changes[2].label).to.be.eq('otherPhone')
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
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(3)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Created')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('')
          expect(history[0].changes[0].to).to.be.eq('John Doe')

          expect(history[0].changes[1].label).to.be.eq('otherEmail')
          expect(history[0].changes[1].ops).to.be.eq('Created')
          expect(history[0].changes[1].path).to.be.eq('email')
          expect(history[0].changes[1].from).to.be.eq('')
          expect(history[0].changes[1].to).to.be.eq('john@email.com')

          expect(history[0].changes[2].label).to.be.eq('otherPhone')
          expect(history[0].changes[2].ops).to.be.eq('Created')
          expect(history[0].changes[2].path).to.be.eq('phone')
          expect(history[0].changes[2].from).to.be.eq('')
          expect(history[0].changes[2].to).to.be.eq('999-99999')

          expect(history[0].action).to.be.eq('Created Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('created')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('otherName')
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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'otherName',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'otherEmail',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'otherPhone',
            'index': null,
            isArray: false
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
    context('Plugin::options.changeTransform', async () => {
      const options = {
        changeTransform: {
          to: 'newTo',
          path: 'newPath',
          from: 'newFrom',
          ops: 'newOps',
          label: 'newLabel'
        }
      }
      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() and Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('newTo').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('newFrom').equal('')
          expect(history[0].changes[0]).to.be.property('newPath').equal('name')
          expect(history[0].changes[0]).to.be.property('newOps').equal('Created')
          expect(history[0].changes[0]).to.be.property('newLabel').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('newTo').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('newFrom').equal('')
          expect(history[0].changes[1]).to.be.property('newPath').equal('email')
          expect(history[0].changes[1]).to.be.property('newOps').equal('Created')
          expect(history[0].changes[1]).to.be.property('newLabel').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('newTo').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('newFrom').equal('')
          expect(history[0].changes[2]).to.be.property('newPath').equal('phone')
          expect(history[0].changes[2]).to.be.property('newOps').equal('Created')
          expect(history[0].changes[2]).to.be.property('newLabel').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() and save history created', test(async () => {
          const _id1 = toString(new ObjectId())

          const mod = [
            { _id: _id1, name: 'Other Name', email: 'john@email.com', phone: '999-99999' }
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: { $in: [_id1] } })

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Created')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('')
          expect(history[0].changes[0].newTo).to.be.eq('Other Name')

          expect(history[0].changes[1].newLabel).to.be.eq('Email')
          expect(history[0].changes[1].newOps).to.be.eq('Created')
          expect(history[0].changes[1].newPath).to.be.eq('email')
          expect(history[0].changes[1].newFrom).to.be.eq('')
          expect(history[0].changes[1].newTo).to.be.eq('john@email.com')

          expect(history[0].changes[2].newLabel).to.be.eq('Phone')
          expect(history[0].changes[2].newOps).to.be.eq('Created')
          expect(history[0].changes[2].newPath).to.be.eq('phone')
          expect(history[0].changes[2].newFrom).to.be.eq('')
          expect(history[0].changes[2].newTo).to.be.eq('999-99999')

          expect(history[0].changes[3].newLabel).to.be.eq('V')
          expect(history[0].changes[3].newOps).to.be.eq('Created')
          expect(history[0].changes[3].newPath).to.be.eq('__v')
          expect(history[0].changes[3].newFrom).to.be.eq('')
          expect(history[0].changes[3].newTo).to.be.eq(0)

          expect(history[0].action).to.be.eq('Created Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('created')
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(3)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Created')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('')
          expect(history[0].changes[0].newTo).to.be.eq('John Doe')

          expect(history[0].changes[1].newLabel).to.be.eq('Email')
          expect(history[0].changes[1].newOps).to.be.eq('Created')
          expect(history[0].changes[1].newPath).to.be.eq('email')
          expect(history[0].changes[1].newFrom).to.be.eq('')
          expect(history[0].changes[1].newTo).to.be.eq('john@email.com')

          expect(history[0].changes[2].newLabel).to.be.eq('Phone')
          expect(history[0].changes[2].newOps).to.be.eq('Created')
          expect(history[0].changes[2].newPath).to.be.eq('phone')
          expect(history[0].changes[2].newFrom).to.be.eq('')
          expect(history[0].changes[2].newTo).to.be.eq('999-99999')

          expect(history[0].action).to.be.eq('Created Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('created')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_UPDATE', async () => {
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_UPDATE', async () => {
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].newLabel).to.be.eq('Name')
          expect(history[0].changes[0].newOps).to.be.eq('Edited')
          expect(history[0].changes[0].newPath).to.be.eq('name')
          expect(history[0].changes[0].newFrom).to.be.eq('John Doe')
          expect(history[0].changes[0].newTo).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_ONE', async () => {
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_REMOVE', async () => {
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_DELETE', async () => {
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_DELETE', async () => {
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          // await getHistory({ documentNumber: _id }, options)
          // await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_MANY', async () => {
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id , method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.REMOVE', async () => {
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_REMOVE', async () => {
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'name',
            'newFrom': 'John Doe',
            'newOps': 'Deleted',
            'newLabel': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'email',
            'newFrom': 'john@email.com',
            'newOps': 'Deleted',
            'newLabel': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'newTo': '',
            'newPath': 'phone',
            'newFrom': '999-99999',
            'newOps': 'Deleted',
            'newLabel': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'newTo': '',
            'newPath': '__v',
            'newFrom': 0,
            'newOps': 'Deleted',
            'newLabel': 'V',
            'index': null,
            isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
    })
    context('Plugin::options.userPaths', async () => {
      const loggedUser = { name: 'Jhon', email: 'john@email.com', roles: ['role1', 'role2'], phone: '52352' }
      const options = { userPaths: ['name', 'email'] }

      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.userPaths and loggedUser and Saved History', test(async () => {
          const _id = toString(new ObjectId())
          Model.addLoggedUser(loggedUser)
          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('user').eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const mod = [
            { _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]
          Model.addLoggedUser(loggedUser)
          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id })

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
          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          Model.addLoggedUser(loggedUser)
          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

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

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Created Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('created')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() with options.userPaths and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateOne() with options.userPaths and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateMany() with options.userPaths and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .findOneAndReplace() with options.userPaths and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .replaceOne() with options.userPaths and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_UPDATE', async () => {
        it('Should call method .findOneAndUpdate() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_UPDATE', async () => {
        it('Should call method .findByIdAndUpdate() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_ONE', async () => {
        it('Should call method .deleteOne() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_REMOVE', async () => {
        it('Should call method .findByIdAndRemove() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_DELETE', async () => {
        it('Should call method .findByIdAndDelete() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_DELETE', async () => {
        it('Should call method .findOneAndDelete() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_MANY', async () => {
        it('Should call method .deleteMany() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          Model.addLoggedUser(loggedUser)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.REMOVE', async () => {
        it('Should call method .remove() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          Model.addLoggedUser(loggedUser)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_REMOVE', async () => {
        it('Should call method .findOneAndRemove() with options.userPaths and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
    })
    context('Plugin::options.isAuthenticated', async () => {
      const loggedUser = { name: 'Jhon', email: 'john@email.com' }
      const options = { isAuthenticated: true }

      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.isAuthenticated and loggedUser and Saved History', test(async () => {
          const _id = toString(new ObjectId())
          Model.addLoggedUser(loggedUser)
          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('user').eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id1 = toString(new ObjectId())

          const mod = [
            { _id: _id1, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]
          Model.addLoggedUser(loggedUser)
          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: { $in: [_id1] } })

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
          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          Model.addLoggedUser(loggedUser)
          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

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

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Created Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('created')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() with options.isAuthenticated and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateOne() with options.isAuthenticated and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateMany() with options.isAuthenticated and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .findOneAndReplace() with options.isAuthenticated and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .replaceOne() with options.isAuthenticated and loggedUser without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_UPDATE', async () => {
        it('Should call method .findOneAndUpdate() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_UPDATE', async () => {
        it('Should call method .findByIdAndUpdate() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_ONE', async () => {
        it('Should call method .deleteOne() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_REMOVE', async () => {
        it('Should call method .findByIdAndRemove() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_DELETE', async () => {
        it('Should call method .findByIdAndDelete() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_DELETE', async () => {
        it('Should call method .findOneAndDelete() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_MANY', async () => {
        it('Should call method .deleteMany() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.addLoggedUser(loggedUser)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.REMOVE', async () => {
        it('Should call method .remove() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          Model.addLoggedUser(loggedUser)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_REMOVE', async () => {
        it('Should call method .findOneAndRemove() with options.isAuthenticated and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          Model.addLoggedUser(loggedUser)
          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].user).eql({ name: 'Jhon', email: 'john@email.com' })
          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('User')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
    })
    context('Plugin::options.moduleName', async () => {
      const options = { moduleName: 'Other Module' }

      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.moduleName, return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999'
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('Other Module')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.moduleName and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const mod = [
            { _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999' },
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id })

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
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('created')
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

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
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('created')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_UPDATE', async () => {
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_UPDATE', async () => {
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(1)

          expect(history[0].changes[0].label).to.be.eq('Name')
          expect(history[0].changes[0].ops).to.be.eq('Edited')
          expect(history[0].changes[0].path).to.be.eq('name')
          expect(history[0].changes[0].from).to.be.eq('John Doe')
          expect(history[0].changes[0].to).to.be.eq('Joe Doe')

          expect(history[0].action).to.be.eq('Edited Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('updated')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_ONE', async () => {
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_REMOVE', async () => {
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_BY_ID_AND_DELETE', async () => {
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_DELETE', async () => {
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.DELETE_MANY', async () => {
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted'}, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.REMOVE', async () => {
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
      context('.FIND_ONE_AND_REMOVE', async () => {
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = { _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999' }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[3]).to.be.deep.eql({
            'to': '', 'path': '__v', 'from': 0, 'ops': 'Deleted', 'label': 'V', 'index': null, isArray: false
          })

          expect(history[0].action).to.be.eq('Removed Document')
          expect(history[0].module).to.be.eq('Other Module')
          expect(history[0].method).to.be.eq('deleted')
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
      })
    })
    context('Plugin::options.omitPaths', async () => {
      const options = { omitPaths: ['otherField', 'moreOtherFields', 'subField'] }

      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.omitPaths, return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.moduleName and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const mod = [
            {
              _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            }
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id })

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
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

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
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
    context.skip('Plugin::options.addCollectionPaths', async () => {
      const options = {
        addCollectionPaths: [
          { key: 'field2', value: 'Date', defaultValue: Date.now },
          { key: 'field1.subField', value: 'String', defaultValue: 'INITIAL' },
        ]
      }
      beforeEach(async () => {
        Model = null
        HistoryModel = null
        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(() => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create() with options.omitPaths, return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            field1: {
              subField: 'XYZ'
            }
          })

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('method').equal('created')
          expect(history[0]).to.be.property('documentNumber').equal(_id.toString())
          expect(history[0]).to.be.property('module').equal('User')
          expect(history[0]).to.be.property('action').equal('Created Document')
          expect(history[0]).to.be.property('createdAt')
          expect(history[0]).to.not.property('user')
          expect(history[0]).to.be.property('changes')
          expect(history[0].changes.length).to.be.eq(3)
          expect(history[0].changes[0]).to.be.property('index').equal(null)
          expect(history[0].changes[0]).to.be.property('isArray').equal(false)
          expect(history[0].changes[0]).to.be.property('to').equal('Other Name')
          expect(history[0].changes[0]).to.be.property('from').equal('')
          expect(history[0].changes[0]).to.be.property('path').equal('name')
          expect(history[0].changes[0]).to.be.property('ops').equal('Created')
          expect(history[0].changes[0]).to.be.property('label').equal('Name')

          expect(history[0].changes[1]).to.be.property('index').equal(null)
          expect(history[0].changes[1]).to.be.property('isArray').equal(false)
          expect(history[0].changes[1]).to.be.property('to').equal('john@email.com')
          expect(history[0].changes[1]).to.be.property('from').equal('')
          expect(history[0].changes[1]).to.be.property('path').equal('email')
          expect(history[0].changes[1]).to.be.property('ops').equal('Created')
          expect(history[0].changes[1]).to.be.property('label').equal('Email')

          expect(history[0].changes[2]).to.be.property('index').equal(null)
          expect(history[0].changes[2]).to.be.property('isArray').equal(false)
          expect(history[0].changes[2]).to.be.property('to').equal('999-99999')
          expect(history[0].changes[2]).to.be.property('from').equal('')
          expect(history[0].changes[2]).to.be.property('path').equal('phone')
          expect(history[0].changes[2]).to.be.property('ops').equal('Created')
          expect(history[0].changes[2]).to.be.property('label').equal('Phone')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.moduleName and loggedUser and save history created', test(async () => {
          const _id = toString(new ObjectId())

          const mod = [
            {
              _id, name: 'Other Name', email: 'john@email.com', phone: '999-99999',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            }
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')
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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(1)
          expect(history[0]).to.be.property('field2')
          expect(history[0].field1.subField).to.be.eq('INITIAL')

          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
    context('Plugin::options.indexes', async () => {
      const resultIndex = [
        [{ 'module': 1 }, { 'background': true }],
        [{ 'method': 1 }, { 'background': true }],
        [{ 'documentNumber': 1 }, { 'background': true }],
        [{ 'documentNumber': -1 }, { 'background': true }]
      ]
      const options = { indexes: [{ documentNumber: -1 }] }
      beforeEach(async () => {
        Model = null
        HistoryModel = null

        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(async () => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create(), return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          })

          await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.moduleName and loggedUser and save history created', test(async () => {
          const _id1 = toString(new ObjectId())
          const _id2 = toString(new ObjectId())

          const mod = [
            {
              _id: _id1, name: 'Other Name', email: 'john@email.com', phone: '999-99999',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            },
            {
              _id: _id2, name: 'Other Name 2', email: 'johndoe@email.com', phone: '8888-88888',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            }
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: { $in: [_id1, _id2] } }, options)

          expect(history.length).to.be.eq(2)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

                    expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

                    expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({documentNumber: _id, method: 'deleted' }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.schema._indexes).to.be.eql(resultIndex)

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
    context('Plugin::options.customCollectionName', async () => {
      const options = { customCollectionName: 'otherCollection' }
      beforeEach(async () => {
        Model = null
        HistoryModel = null

        const schema = {
          name: { type: String },
          email: { type: String },
          phone: { type: String }
        }
        Model = await initModel({ schema, options })
      })
      afterEach(async () => {
        Model = null
        HistoryModel = null
      })

      context('.CREATE', async () => {
        it('Should call method .create(), return Saved History', test(async () => {
          const _id = toString(new ObjectId())

          await Model.create({
            _id,
            name: 'Other Name',
            email: 'john@email.com',
            phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          })

          await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')
        }))
      })
      context('.INSERT_MANY', async () => {
        it('Should call method .insertMany() with    options.moduleName and loggedUser and save history created', test(async () => {
          const _id1 = toString(new ObjectId())
          const _id2 = toString(new ObjectId())

          const mod = [
            {
              _id: _id1, name: 'Other Name', email: 'john@email.com', phone: '999-99999',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            },
            {
              _id: _id2, name: 'Other Name 2', email: 'johndoe@email.com', phone: '8888-88888',
              otherField: 'blabla',
              moreOtherFields: ['a', 'b', 'c'],
              subField: {
                field: 'XYZ'
              }
            }
          ]

          await Model.insertMany(mod)
          const history = await getHistory({ documentNumber: { $in: [_id1, _id2] } }, options)

          expect(history.length).to.be.eq(2)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')
        }))
      })
      context('.SAVE', async () => {
        it('Should call method .save() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          await model.save()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
          expect(history[0].documentNumber).to.be.eq(_id)
        }))
        it('Should call method .save() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          let model = new Model(mod)
          const result = await model.save()

          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await result.save()

          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_ONE', async () => {
        it('Should call method .updateOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .updateOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

                    expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE_MANY', async () => {
        it('Should call method .updateMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .updateMany() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.updateMany({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.FIND_ONE_AND_REPLACE', async () => {
        it('Should call method .findOneAndReplace() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .findOneAndReplace() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndReplace({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(history.length).to.be.eq(0)
          expect(HistoryModel.modelName).to.be.eq('otherCollection')
        }))
      })
      context('.REPLACE_ONE', async () => {
        it('Should call method .replaceOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

                    expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .replaceOne() without diff and not save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.replaceOne({ _id }, { name: 'John Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(0)
        }))
      })
      context('.UPDATE', async () => {
        it('Should call method .update() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.update({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .findOneAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .findByIdAndUpdate() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndUpdate({ _id }, { name: 'Joe Doe' }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

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
        it('Should call method .deleteOne() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.deleteOne({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findByIdAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findByIdAndDelete(_id).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndDelete() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndDelete({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .deleteMany() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({ documentNumber: _id, method: 'deleted' }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .remove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await Model.deleteMany({ _id }).lean()
          const history = await getHistory({documentNumber: _id, method: 'deleted' }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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
        it('Should call method .findOneAndRemove() and save history created', test(async () => {
          const _id = toString(new ObjectId())
          const mod = {
            _id, name: 'John Doe', email: 'john@email.com', phone: '999-99999',
            otherField: 'blabla',
            moreOtherFields: ['a', 'b', 'c'],
            subField: {
              field: 'XYZ'
            }
          }

          await Model.create(mod)
          await getHistory({ documentNumber: _id }, options)
          await HistoryModel.deleteMany({})

          await Model.findOneAndRemove({ _id }).lean()
          const history = await getHistory({ documentNumber: _id }, options)

          expect(HistoryModel.modelName).to.be.eq('otherCollection')

          expect(history.length).to.be.eq(1)
          expect(history[0].changes.length).to.be.eq(4)

          expect(history[0].changes[0]).to.be.deep.eql({
            'to': '',
            'path': 'name',
            'from': 'John Doe',
            'ops': 'Deleted',
            'label': 'Name',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[1]).to.be.deep.eql({
            'to': '',
            'path': 'email',
            'from': 'john@email.com',
            'ops': 'Deleted',
            'label': 'Email',
            'index': null,
            isArray: false
          })
          expect(history[0].changes[2]).to.be.deep.eql({
            'to': '',
            'path': 'phone',
            'from': '999-99999',
            'ops': 'Deleted',
            'label': 'Phone',
            'index': null,
            isArray: false
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

  async function getHistory (query = {}, options = {}) {
    HistoryModel = await HistoryLogModel(mongooseConnection, options)
    return await HistoryModel.find(query).lean()
  }

  async function initModel ({ schema, options = {} } = {}) {
    options = { mongooseConnection, ...options }
    const Schema = new mongoose.Schema(schema)
    Schema.plugin(mongooseHistoryTrace, options)
    return mongooseConnection.model(modelName, Schema, modelName)
  }

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
