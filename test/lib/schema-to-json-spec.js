const { modelToJSONSchema } = require('../../lib/schema-to-json.js')
const { Schema } = require('mongoose')
const { keys } = require('lodash')

describe('class JsonSchema', () => {
  context('method .modelToJSONSchema', () => {
    it('Should call .modelToJSONSchema without params return empty array', () => {
      const result = modelToJSONSchema()

      expect(result).to.be.eql({})
    })
    it('Should edited one field with value of null return diffs', () => {
      const oneSchema = new Schema({
        field: { type: Number }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({ _id: 'string', field: 'number' })
    })
    it('Should edited one field with _label_ return diffs', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        'field': 'string',
        _id: 'string'
      })
    })
    it('Should removed one field  with _label_ return diffs', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: 'otherField' },
        fieldTwo: String
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        _id: 'string',
        field: 'string',
        fieldTwo: 'string'
      })
    })

    it('Should created new item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        _id: 'string',
        fields: {
          _array_: {
            otherField: 'string',
            _id: 'string'
          }
        }
      })
    })
    it('Should edited one item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] },
        oneField: {
          twoField: String,
          threeField: String,
          fourField: String
        }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        _id: 'string',
        fields: {
          _array_: {
            _id: 'string',
            otherField: 'string'
          }
        },
        oneField: {
          twoField: 'string',
          threeField: 'string',
          fourField: 'string'
        }
      })
    })
    it('Should edited one item array without _label_ return diffs and index array', () => {
      const otherSchema = new Schema({
        value: { type: String }
      })
      const oneSchema = new Schema({
        fields: {
          otherField: {
            moreFields: { type: [otherSchema] }
          }
        }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        _id: 'string',
        fields: {
          otherField: {
            moreFields: {
              _array_: {
                _id: 'string',
                value: 'string'
              }
            }
          }
        }
      })
    })
    it('Should excluded one item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: [otherSchema],
        moreField: otherSchema
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        _id: 'string',
        fields: {
          _array_: {
            _id: 'string',
            otherField: 'string'
          }
        },
        moreField: {
          _id: 'string',
          otherField: 'string'
        }
      })
    })

    it('Should created new item subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Sub Doc Path' }
      })
      const oneSchema = new Schema({
        fields: { type: otherSchema }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        fields: {
          otherField: 'string',
          _id: 'string'
        },
        _id: 'string'
      })
    })
    it('Should edited subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Sub Doc' }
      })
      const oneSchema = new Schema({
        fields: { type: otherSchema }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        fields: {
          otherField: 'string',
          _id: 'string'
        },
        _id: 'string'
      })
    })
    it('Should excluded item subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Excluded Path' }
      })
      const oneSchema = new Schema({
        field: { type: otherSchema }
      })

      const result = modelToJSONSchema(oneSchema)

      expect(result).to.be.eql({
        field: {
          otherField: 'string',
          _id: 'string'
        },
        _id: 'string'
      })
    })

  })
})
