const {
  getDiff,
  _capitalizedKey,
  _getLabel,
  _getCustomLabel,
  _objectMapped,
  _changeTransformToView,
  _getIndexIsArray
} = require('../../lib/diffHelper')
const { Schema } = require('mongoose')
const { keys } = require('lodash')

describe('class HelperDiff', () => {
  context('method .getDiff', () => {
    it('Should call .getDiff without params return empty array', () => {
      const result = getDiff()

      expect(result.length).to.be.eq(0)
    })
    it('Should edited one field with _label_ return diffs', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' }
      })

      const old = { field: 'old value' }
      const current = { field: 'new value' }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('new value')
      expect(result[0].from).to.be.eq('old value')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('field')
      expect(result[0].label).to.be.eq('1º St Label')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })
    it('Should edited one field without schema return diffs', () => {
      const old = { field: 'old value' }
      const current = { field: 'new value' }

      const result = getDiff({ old, current })

      expect(result[0].to).to.be.eq('new value')
      expect(result[0].from).to.be.eq('old value')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('field')
      expect(result[0].label).to.be.eq('Field')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })
    it('Should created one field  with _label_ return diffs', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' }
      })

      const old = {}
      const current = { field: 'new value' }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('new value')
      expect(result[0].from).to.be.eq('')
      expect(result[0].ops).to.be.eq('Created')
      expect(result[0].path).to.be.eq('field')
      expect(result[0].label).to.be.eq('1º St Label')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })
    it('Should removed one field  with _label_ return diffs', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' },
        fieldTwo: { type: String }
      })

      const old = { fieldTwo: 'field removed', field: 'value' }
      const current = { fieldTwo: 'value' }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('value')
      expect(result[0].from).to.be.eq('field removed')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('fieldTwo')
      expect(result[0].label).to.be.eq('Field Two')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)

      expect(result[1].to).to.be.eq('')
      expect(result[1].from).to.be.eq('value')
      expect(result[1].ops).to.be.eq('Deleted')
      expect(result[1].path).to.be.eq('field')
      expect(result[1].label).to.be.eq('1º St Label')
      expect(result[1].isArray).to.be.eq(false)
      expect(result[1].index).to.be.eq(null)
    })

    it('Should created new item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] }
      })

      const old = { fields: [] }
      const current = { fields: [{ otherField: 'value' }] }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('value')
      expect(result[0].from).to.be.eq('')
      expect(result[0].ops).to.be.eq('Created')
      expect(result[0].path).to.be.eq('fields.otherField')
      expect(result[0].label).to.be.eq('Other Field')
      expect(result[0].isArray).to.be.eq(true)
      expect(result[0].index).to.be.eq(0)
    })
    it('Should edited one item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] }
      })

      const old = { fields: [{ otherField: 'old value' }] }
      const current = { fields: [{ otherField: 'value' }] }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('value')
      expect(result[0].from).to.be.eq('old value')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('fields.0.otherField')
      expect(result[0].label).to.be.eq('Other Field')
      expect(result[0].isArray).to.be.eq(true)
      expect(result[0].index).to.be.eq(0)
    })
    it('Should edited one item array without _label_ return diffs and index array', () => {
      const otherSchema = new Schema({
        value: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] }
      })

      const old = { fields: [{ value: 'one' }, { value: 'two' }] }
      const current = { fields: [{ value: 'one' }, { value: 'one' }] }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('one')
      expect(result[0].from).to.be.eq('two')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('fields.1.value')
      expect(result[0].label).to.be.eq('Value')
      expect(result[0].isArray).to.be.eq(true)
      expect(result[0].index).to.be.eq(1)
    })
    it('Should excluded one item array without _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String }
      })
      const oneSchema = new Schema({
        fields: { type: [otherSchema] }
      })

      const old = { fields: [{ otherField: { field: 'one value' } }, { otherField: { field: 'two value' } }] }
      const current = { fields: [{ otherField: { field: 'one value' } }] }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('')
      expect(result[0].from).to.be.eq('two value')
      expect(result[0].ops).to.be.eq('Deleted')
      expect(result[0].path).to.be.eq('fields.otherField.field')
      expect(result[0].label).to.be.eq('Field')
      expect(result[0].isArray).to.be.eq(true)
      expect(result[0].index).to.be.eq(1)
    })

    it('Should created new item subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Sub Doc Path' }
      })
      const oneSchema = new Schema({
        fields: { type: otherSchema }
      })

      const old = {}
      const current = { fields: { otherField: 'value' } }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('value')
      expect(result[0].from).to.be.eq('')
      expect(result[0].ops).to.be.eq('Created')
      expect(result[0].path).to.be.eq('fields.otherField')
      expect(result[0].label).to.be.eq('Sub Doc Path')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })
    it('Should edited subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Sub Doc' }
      })
      const oneSchema = new Schema({
        fields: { type: otherSchema }
      })

      const old = { fields: { otherField: 'old value' } }
      const current = { fields: { otherField: 'value' } }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('value')
      expect(result[0].from).to.be.eq('old value')
      expect(result[0].ops).to.be.eq('Edited')
      expect(result[0].path).to.be.eq('fields.otherField')
      expect(result[0].label).to.be.eq('Sub Doc')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })
    it('Should excluded item subdoc with _label_ return diffs', () => {
      const otherSchema = new Schema({
        otherField: { type: String, _label_: 'Excluded Path' }
      })
      const oneSchema = new Schema({
        field: { type: otherSchema }
      })

      const old = { field: { otherField: 'one value' } }
      const current = { field: {} }

      const result = getDiff({ old, current }, oneSchema)

      expect(result[0].to).to.be.eq('')
      expect(result[0].from).to.be.eq('one value')
      expect(result[0].ops).to.be.eq('Deleted')
      expect(result[0].path).to.be.eq('field.otherField')
      expect(result[0].label).to.be.eq('Excluded Path')
      expect(result[0].isArray).to.be.eq(false)
      expect(result[0].index).to.be.eq(null)
    })

  })
  context('method ._changeTransformToView', () => {
    it('Should without options and change return null', () => {
      const result = _changeTransformToView()

      expect(result).to.be.eq(null)
    })
    it('Should change without options return default paths on change', () => {
      const change = {
        to: 'value1',
        from: 'value2',
        label: 'value3',
        path: 'value4',
        ops: 'value5',
        index: null,
        isArray: false
      }
      const result = _changeTransformToView(change)

      expect(result).to.deep.eql(change)
      expect(keys(result)).to.be.include('to')
      expect(keys(result)).to.be.include('from')
      expect(keys(result)).to.be.include('label')
      expect(keys(result)).to.be.include('path')
      expect(keys(result)).to.be.include('ops')
      expect(keys(result)).to.be.include('index')
      expect(keys(result)).to.be.include('isArray')
    })
    it('Should change with options return transform paths on change', () => {
      const options = {
        changeTransform: {
          to: 'next',
          from: 'preview',
          label: 'field',
          ops: 'action',
          path: 'pathFlatten'
        }
      }
      const change = { to: 'value1', from: 'value2', label: 'value3', path: 'value4', ops: 'value5' }
      const result = _changeTransformToView(change, options)

      expect(keys(result)).to.be.include('next')
      expect(keys(result)).to.be.include('preview')
      expect(keys(result)).to.be.include('field')
      expect(keys(result)).to.be.include('action')
      expect(keys(result)).to.be.include('pathFlatten')
    })
  })
  context('method ._objectMapped', () => {
    it('Should call ._objectMapped without params return undefined', () => {
      const result = _objectMapped()

      expect(result).to.be.eq(undefined)
    })
  })
  context('Method ._capitalizedKey', () => {
    it('should pass empty string return empty string', () => {
      const result = _capitalizedKey()

      expect(result).to.equal('')
    })

    it('should pass camelcase string and return capitalized name', () => {
      const result = _capitalizedKey('oneNameCamelCase')

      expect(result).to.equal('One Name Camel Case')
    })

    it('should pass underScoreCase string and return capitalized name', () => {
      const result = _capitalizedKey('one_Name_Camel_Case')

      expect(result).to.equal('One Name Camel Case')
    })

    it('should pass upperCase string and return capitalized name', () => {
      const result = _capitalizedKey('ONE')

      expect(result).to.equal('One')
    })

    it('should pass lowerCase string and return capitalized name', () => {
      const result = _capitalizedKey('lowercase')

      expect(result).to.equal('Lowercase')
    })
    it('should pass mixed string and return capitalized name', () => {
      const result = _capitalizedKey('ONE_name_Mixed-string')

      expect(result).to.equal('One Name Mixed String')
    })
  })
  context('Method ._getLabel', () => {
    it('should pass without params return empty string', () => {
      const result = _getLabel()

      expect(result).to.be.equal('')
    })
    it('should pass path flatten return last path capitalized without pathSchema', () => {
      const result = _getLabel('field.subfield')

      expect(result).to.be.equal('Subfield')
    })
    it('should pass path array return last path capitalized without pathSchema', () => {
      const result = _getLabel('fields.0.name')

      expect(result).to.be.equal('Name')
    })
    it('should pass path array in array return last path capitalized without pathSchema', () => {
      const result = _getLabel('fields.0.list.0.isActive')

      expect(result).to.be.equal('Is Active')
    })
    it('should schema with sub document and _label_ options return  custom label', () => {
      const oneSchema = new Schema({
        field: {
          numberRef: { type: String, _label_: 'Reference N.º' }
        }
      })
      const result = _getLabel('field.numberRef', oneSchema)

      expect(result).to.be.equal('Reference N.º')
    })
    it('should simples schema with _label_ options and return custom label', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' }
      })
      const result = _getLabel('field', oneSchema)

      expect(result).to.be.equal('1º St Label')
    })
    it('should schema with subDoc with _label_ options and return custom label', () => {
      const arraySchema = new Schema({
        oneField: String,
        otherField: { type: String },
        field: {
          subField: {
            otherField: { type: Date, _label_: '3º St Label' }
          }
        }
      })
      const result = _getLabel('field.subField.otherField', arraySchema)

      expect(result).to.be.equal('3º St Label')
    })
    it('should array schema with subdoc array schema with _label_ options and return custom label', () => {
      const otherSchema = new Schema({
        field: { type: Date, _label_: '3º St Label' }
      })
      const oneSchema = new Schema({
        otherFields: { type: [otherSchema] }
      })
      const arraySchema = new Schema({
        oneField: { twoField: { threeField: { type: String, _label_: 'Sub doc Field' } } },
        subDoc: { type: oneSchema },
        fields: { type: [oneSchema] },
        otherField: String
      })

      let result = _getLabel('fields.otherFields.field', arraySchema)
      expect(result).to.be.equal('3º St Label')

      result = _getLabel('oneField.twoField.threeField', arraySchema)
      expect(result).to.be.equal('Sub doc Field')

      result = _getLabel('subDoc.otherFields.field', arraySchema)
      expect(result).to.be.equal('3º St Label')

      result = _getLabel('otherField', arraySchema)
      expect(result).to.be.equal('Other Field')
    })
  })
  context('method ._getCustomLabel', () => {
    it('Should call ._getCustomLabel without params return undefined', () => {
      const result = _getCustomLabel()

      expect(result).to.be.eq(undefined)
    })
    it('Should pass array path without schema return undefined', () => {
      const pathsArray = [
        'field',
        'subfield'
      ]

      const result = _getCustomLabel(pathsArray)

      expect(result).to.be.eq(undefined)
    })
    it('Should pass one field  with _label_ return custom label', () => {
      const oneSchema = new Schema({
        field: { type: String, _label_: '1º St Label' }
      })

      const pathsArray = [
        'field'
      ]

      const result = _getCustomLabel(pathsArray, oneSchema)

      expect(result).to.be.eq('1º St Label')
    })
    it('Should pass one field  without _label_ return undefined', () => {
      const oneSchema = new Schema({
        field: { type: String }
      })

      const pathsArray = [
        'field'
      ]

      const result = _getCustomLabel(pathsArray, oneSchema)

      expect(result).to.be.eq(undefined)
    })
  })
  context('method ._getIndexIsArray', () => {
    it('Should call ._getIndexIsArray without path return { index: null, isArray: false }', () => {
      const result = _getIndexIsArray({ })

      expect(result).to.be.eql({ index: null, isArray: false })
    })
    it('Should call ._getIndexIsArray with path return { index: null, isArray: false }', () => {
      const path = [ 'field', 'subfield' ]

      const result = _getIndexIsArray({ item: {path} })

      expect(result).to.be.eql({ index: null, isArray: false })
    })
    it('Should call ._getIndexIsArray with path and ops==Array return { index: null, isArray: true }', () => {
      const path = [ 'field', 'subfield' ]

      const result = _getIndexIsArray({ item: {path}, ops: 'Array' })

      expect(result).to.be.eql({ index: null, isArray: true} )
    })
    it('Should call ._getIndexIsArray with path and ops==Array and index==1 return { index: 3, isArray: true }', () => {
      const path = [ 'field', 3, 'subfield' ]

      const result = _getIndexIsArray({ item: {path}, ops: 'Array' })

      expect(result).to.be.eql({ index: 3, isArray: true} )
    })
    it('Should call ._getIndexIsArray with path and index==1 without ops return { index: 3, isArray: true }', () => {
      const path = [ 'field', 3, 'subfield' ]

      const result = _getIndexIsArray({ item: {path} })

      expect(result).to.be.eql({ index: 3, isArray: true} )
    })
  })
})
