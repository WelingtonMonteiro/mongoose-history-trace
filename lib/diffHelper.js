'use strict'
const { diff } = require('deep-diff')
const { modelToJSONSchema } = require('./schema-to-json')
const {
  set,
  get,
  map,
  omit,
  startCase,
  camelCase,
  compact,
  concat,
  isEmpty,
  isNumber,
  includes,
  isNil,
  result: execute
} = require('lodash')
const OPERATION = { N: 'Created', D: 'Deleted', E: 'Edited', A: 'Array' }
let changes = []

class DiffHelper {
  /**
   * @author welington Monteiro
   * @param { Object } [diffParams.old] - old json
   * @param { Object } [diffParams.current] - current json
   * @param { Object } [diffParams] - params {old, current}
   * @param {{}} schema - paths schema mapped
   * @param { Object } [options] - options params
   * @param { Array<String> } [options.omitPaths] - options omitPaths params
   * @param { String } [options.changeTransform.label] - options changesToView.label {label: 'otherPathName'}
   * @param { String } [options.changeTransform.to] - options changesToView.to {to: 'otherPathName'}
   * @param { String } [options.changeTransform.from] - options changesToView.from {from: 'otherPathName'}
   * @param { String } [options.changeTransform.ops] - options changesToView.ops {ops: 'otherPathName'}
   * @param { String } [options.changeTransform.path] - options changesToView.path {path: 'otherPathName'}
   * @return { Array } - list of diffs changes
   */
  static getDiff (diffParams = {}, schema = {}, options = {}) {
    let { old = {}, current = {} } = diffParams
    const omitPaths = get(options, 'omitPaths', [])
    const defaultOmitPaths = ['_id']

    old = omit(old, concat(omitPaths, defaultOmitPaths))
    current = omit(current, concat(omitPaths, defaultOmitPaths))
    changes = []

    const differences = diff(old, current)

    DiffHelper._mapItems(differences, schema, options)
    return compact(changes)
  }

  /**
   * @author Welington Monteiro
   * @param { Array } diffs - deep diffs between old and current
   * @param { Schema } schema - paths schema mapped
   * @param { Object } [options] - options params
   * @return {void}
   * @private
   */
  static _mapItems (diffs, schema, options) {
    map(diffs, _addItem)

    function _addItem (item) {
      const to = get(item, 'rhs', get(item, 'item.rhs', ''))
      const path = item.path.join('.')
      const from = get(item, 'lhs', get(item, 'item.lhs', ''))
      let ops = OPERATION[get(item, 'kind', '')]
      const { index, isArray } = DiffHelper._getIndexIsArray({ item, ops })

      if (ops === 'Array') ops = OPERATION[get(item, 'item.kind', '')] || ops

      if (DiffHelper._isObject(to)) {
        return DiffHelper._objectMapped({ path, item: to, ops, schema, index, isArray }, 'to', options)
      }
      if (DiffHelper._isObject(from)) {
        return DiffHelper._objectMapped({ path, item: from, ops, schema, index, isArray }, 'from', options)
      }
      const label = DiffHelper._getLabel(path, schema)
      const jsonSchema = modelToJSONSchema(schema)
      const isOmitted = DiffHelper._omittedFieldsIfNotMapped(path, jsonSchema, options)

      if (isOmitted) return

      changes.push(DiffHelper._changeTransformToView({ to, path, from, ops, label, index, isArray }, options))
    }
  }

  static unFlattenJson (data) {
    if (Object(data) !== data || Array.isArray(data)) {
      return data
    }
    const regex = /\.?([^.[\]]+)|\[(\d+)\]/g
    const resultholder = {}

    for (const p in data) {
      let cur = resultholder
      let prop = ''
      let m
      // eslint-disable-next-line
      while (m = regex.exec(p)) {
        cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}))
        prop = m[2] || m[1]
      }
      cur[prop] = data[p]
    }
    return resultholder[''] || resultholder
  }

  static flatJson (obj, opts, parentProp, $set) {
    $set = $set || {}
    opts = opts || {}
    const json = execute(obj, 'toJSON', obj)

    for (const prop in json) {
      const value = json[prop]
      const newProp = (parentProp ? parentProp + '.' : '') + prop
      const isJsonObject = typeof value === 'object' &&
        value !== null &&
        value !== undefined &&
        !(value instanceof Date) &&
        !(get(value, 'constructor.name') === 'ObjectID') &&
        prop !== '_id'

      if (Array.isArray(value)) {
        $set[newProp] = value
      } else if (isJsonObject) {
        DiffHelper.flatJson(value, opts, newProp, $set)
      } else {
        if (get(opts, 'omitNullAndEmpty')) {
          if (!isNil(value) && value !== '') $set[newProp] = value
        } else {
          $set[newProp] = value
        }
      }
    }
    return $set
  }

  /**
   * @author Welington Monteiro
   * @description Verify is value is object
   * @param { * } value - Value for comparison
   * @return { boolean } - return is object
   */
  static _isObject (value) {
    return Object.prototype.toString.call(value) === '[object Object]'
  }

  /**
   * @author Welington Monteiro
   * @param { Object } change - object params
   * @param { Object } [options] -  options change transform to view
   * @return {Object} newChange - object new transformed
   */
  static _changeTransformToView (change = {}, options = {}) {
    const newChange = { index: null, isArray: false }
    if (isEmpty(change)) return null

    set(newChange, 'isArray', get(change, 'isArray'))
    set(newChange, 'index', get(change, 'index'))
    set(newChange, `${get(options, 'changeTransform.to') || 'to'}`, get(change, 'to'))
    set(newChange, `${get(options, 'changeTransform.from') || 'from'}`, get(change, 'from'))
    set(newChange, `${get(options, 'changeTransform.path') || 'path'}`, get(change, 'path'))
    set(newChange, `${get(options, 'changeTransform.ops') || 'ops'}`, get(change, 'ops'))
    set(newChange, `${get(options, 'changeTransform.label') || 'label'}`, get(change, 'label'))

    return newChange
  }

  /**
   * @author Welington Monteiro
   * @param { Object } item - item to mapped fields
   * @param { String } ops - type of path
   * @return {{index: null, isArray: boolean}} - return object
   * @private
   */
  static _getIndexIsArray ({ item = {}, ops = '' }) {
    let index = get(item, 'index', null)
    let isArray = ops === 'Array'

    map(get(item, 'path'), (field) => {
      if (isNumber(field)) {
        index = field
        isArray = true
      }
    })
    return { index, isArray }
  }

  /**
   * @author Welington Monteiro
   * @param { Object } [params] - item to mapped fields
   * @param { Object } [params.item] - item to mapped fields
   * @param { String } [params.path] - path fields
   * @param { String } [params.ops] - ops mapped
   * @param { Object } [params.schema] - paths schema mapped
   * @param [params] - params mapped
   * @param { String } fieldItem - name field item mapped to object
   * @param { Object } [options] - options change transform to view
   * @private
   */
  static _objectMapped (params = {}, fieldItem, options) {
    const { item = '', path, ops, schema = {}, index = null, isArray = false } = params
    map(item, (value, field) => {
      const newPath = `${path}.${field}`

      if (typeof value === 'object') {
        return DiffHelper._objectMapped({ path: newPath, item: value, ops, schema, index, isArray }, fieldItem, options)
      }
      const change = { from: '', to: '' }
      const label = DiffHelper._getLabel(newPath, schema)

      change[`${fieldItem}`] = value
      changes.push(DiffHelper._changeTransformToView({ ...change, path: newPath, ops, label, index, isArray }, options))
    })
  }

  /**
   * @author Welington Monteiro
   * @param { String } str - string name to capitalize
   * @return {string} name field capitalized
   * @private
   */
  static _capitalizedKey (str = '') {
    return startCase(camelCase(str))
  }

  /**
   * @author Welington Monteiro
   * @param { String } path - path object
   * @param { Object } schema - paths schema mapped
   * @return { string } return result
   * @private
   */
  static _getLabel (path = '', schema = {}) {
    const paths = compact(path.replace(/[0-9]/ig, '').split('.'))
    const lastPath = paths[paths.length - 1]
    const label = DiffHelper._getCustomLabel(paths, schema)
    const nameCapitalized = DiffHelper._capitalizedKey(lastPath)

    return (label || nameCapitalized)
  }

  /**
   * @author Welington Monteiro
   * @param { Array } pathsArray - flatten paths schema
   * @param { Object } schema - Schemas mapped paths
   * @return {string} customLabel - return name custom label
   */
  static _getCustomLabel (pathsArray = [], schema = {}) {
    const flattenPath = pathsArray.join('.')
    const paths = !isEmpty(schema.paths) ? schema.paths[flattenPath] : ''
    const singleNestedPaths = !isEmpty(schema.singleNestedPaths) ? schema.singleNestedPaths[flattenPath] : ''
    const subpaths = !isEmpty(schema.subpaths) ? schema.subpaths[flattenPath] : ''

    return get(paths, 'options._label_', get(singleNestedPaths, 'options._label_', get(subpaths, 'options._label_')))
  }

  /**
   * @author Welington Monteiro
   * @description Omitted field if not mapped on dicionary
   * @param { String } path - Item mapped
   * @param { Object } flatDictionary - Dictionary flatten
   * @return { Boolean } isOmitted - Returns item
   * @param { Object } [options] - options change transform to view
   * @private
   */
  static _omittedFieldsIfNotMapped (path, flatDictionary, options) {
    if (isEmpty(flatDictionary)) return false
    const isStrict = get(options, 'isStrict', true)
    let isOmitted = false
    const isMapped = !!DiffHelper.getPathNameMapped(path, flatDictionary)
    if (!isMapped && isStrict) isOmitted = true

    return isOmitted
  }

  /**
   * @author Welington Monteiro
   * @description Replace index number for place holder
   * @param { String } path - Path item
   * @param flatDictionary
   * @return {*}
   * @private
   */
  static getPathNameMapped (path, flatDictionary = {}) {
    const pathReplaced = DiffHelper.replaceIndexWithPlaceholder(path)
    const pathLabelName = DiffHelper.getLabelOrKeyName(pathReplaced, '_label_')
    const pathKeyName = DiffHelper.getLabelOrKeyName(pathReplaced, '_key_')

    const pathWithLabelName = get(flatDictionary, `${pathLabelName}`)
    const pathWithKeyName = get(flatDictionary, `${pathKeyName}`)
    const pathWithArrayName = get(flatDictionary, `${pathReplaced}`)

    return (pathWithLabelName || pathWithKeyName || pathWithArrayName)
  }

  /**
   * @author Welington Monteiro
   * @param { String } path - Path item
   * @return {*}
   * @private
   */
  static replaceIndexWithPlaceholder (path) {
    path = path.replace(/(\.)([0-9]+)(\.)/g, '._array_.')
    path = path.replace(/(\.)([0-9]+)/g, '._array_')
    return path
  }

  /**
   * @author Welington Monteiro
   * @param { String } pathReplaced - Path with place holder _array_ item
   * @param { String } key - Key name: _key_ , _label_
   * @return {string}
   */
  static getLabelOrKeyName (pathReplaced, key = '_label_') {
    let paths = pathReplaced.split('.')
    const lastPath = paths.pop()

    if (includes(['_array_'], lastPath)) {
      paths.push(lastPath)
    }
    if (includes(['_label_', '_key_'], lastPath)) {
      paths.push(lastPath)
    }
    paths.push(key)
    paths = paths.join('.')

    return paths
  }
}

module.exports = DiffHelper
