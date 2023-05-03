'use strict'
const { get, set, isEmpty } = require('lodash')

class JsonSchema {
  /**
   * @alias module:mongoose-jsonschema
   * @param   {object}  schema   -  Mongoose model to be converted
   * @param   {{reserved: {property: boolean}}|{}}  [options] -  Options for customising model conversion
   * @returns {Object}  JSONSchema
   */
  static modelToJSONSchema (schema, options) {
    options = options || {}
    const result = {}
    if (isEmpty(schema)) return result
    JsonSchema._mapFields({ schema, options, result })

    return result
  }

  static _mapFields ({ schema, result, pathNode, options }) {
    schema.eachPath((path) => {
      const name = path
      const pathOptions = schema.path(path).options
      const { type, value } = JsonSchema._getTypeField({ pathOptions })

      if (type === 'array') {
        return JsonSchema._mapFields({ schema: value[0], options, result, pathNode: `${name}._array_` })
      }
      if (type === 'object') {
        return JsonSchema._mapFields({ schema: value, options, result, pathNode: `${name}` })
      }

      if (pathNode) set(result, `${pathNode}.${name}`, type)
      else set(result, `${name}`, type)
    })
  }

  /**
   * @description get type fields
   * @author Welington Monteiro
   * @param { Object } pathOptions - Path options schema
   * @return {{type: string, value: string}}
   * @private
   */
  static _getTypeField ({ pathOptions }) {
    const typeName = get(pathOptions, 'type.name')// === 'ObjectId' ? 'ObjectId' : get(pathOptions, 'type.name')
    const pathOptionType = get(pathOptions, 'type')
    const typeOfValue = Object.prototype.toString.call(pathOptionType)
    let type = `${typeName}`.toLowerCase()
    let value = ''

    // mixed type
    if (get(pathOptionType, 'schemaName')) {
      type = 'object'
      value = pathOptionType
    }

    if (Array.isArray(pathOptionType)) {
      type = 'array'
      value = pathOptionType
    }
    if (typeOfValue === '[object Object]') {
      type = 'object'
      value = pathOptionType
    }
    if (pathOptionType === 'ObjectId') {
      type = 'string'
      value = ''
    }

    return { type, value }
  }
}

/**
 * A module for converting Mongoose schema to JSON schema.
 * @module mongoose-jsonschema
 */

module.exports = JsonSchema
