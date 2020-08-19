'use strict'

const { diff } = require('deep-diff')
const { get, map, omit, startCase, camelCase, compact, concat } = require('lodash')
const OPERATION = { N: 'Created', D: 'Deleted', E: 'Edited', A: 'Array' }
let changes = []

class HelperDiff {
    /**
     * @author welington Monteiro
     * @param { Object } [old] - Old object
     * @param { Object } [current] - Current object
     * @param { Object } pathsSchema - paths schema mapped
     * @param { Object } [options] - options params
     * @return { Array } - list of diffs changes
     */
    static getDiff({ old = {}, current = {}, pathsSchema = {} }, options = {}) {
        const omitPaths = get(options, 'omitPaths', [])
        const defaultOmitPaths = ['_id', '__v']

        old = omit(old, concat(omitPaths, defaultOmitPaths))
        current = omit(current, concat(omitPaths, defaultOmitPaths))
        pathsSchema = omit(pathsSchema, concat(omitPaths, defaultOmitPaths))
        changes = []

        const differences = diff(old, current)

        HelperDiff._mapItems(differences, pathsSchema)
        return changes
    }

    /**
     * @author Welington Monteiro
     * @param { Array } diffs - deep diffs between old and current
     * @param { Object } pathsSchema - paths schema mapped
     * @return {void}
     * @private
     */
    static _mapItems(diffs, pathsSchema) {
        map(diffs, _addItem)

        function _addItem(item) {
            const to = get(item, 'rhs', get(item, 'item.rhs', ''))
            const path = item.path.join('.')
            const from = get(item, 'lhs', get(item, 'item.lhs', ''))
            let ops = OPERATION[get(item, 'kind', '')]

            if (ops === 'Array') ops = OPERATION[get(item, 'item.kind', '')]

            if (typeof to === 'object') return HelperDiff._objectMapped({ path, item: to, ops, pathsSchema }, 'to')
            if (typeof from === 'object') return HelperDiff._objectMapped({ path, item: from, ops, pathsSchema }, 'from')
            const label = HelperDiff._getLabel(path, pathsSchema)

            changes.push({ to, path, from, ops, label })
        }
    }

    /**
     * @author Welington Monteiro
     * @param { Object } item - item to mapped fields
     * @param { String } path - path fields
     * @param { String } ops - ops mapped
     * @param { Object } pathsSchema - paths schema mapped
     * @param { String } fieldItem - name field item mapped to object
     * @private
     */
    static _objectMapped({ item = '', path, ops, pathsSchema = {} }, fieldItem) {
        map(item, (value, field) => {
            const newPath = `${path}.${field}`

            if (typeof value === 'object') {
                return HelperDiff._objectMapped({ path: newPath, item: value, ops }, fieldItem)
            }
            const change = { from: '', to: '' }
            const label = HelperDiff._getLabel(newPath, pathsSchema)

            change[`${fieldItem}`] = value
            changes.push({ ...change, path: newPath, ops, label })
        })
    }

    /**
     * @author Welington Monteiro
     * @param { String } str - string name to capitalize
     * @return {string} name field capitalized
     * @private
     */
    static _capitalizedKey(str = '') {
        return startCase(camelCase(str))
    }

    /**
     * @author Welington Monteiro
     * @param { String } path - path object
     * @param { Object } pathsSchema - paths schema mapped
     * @return { string } return result
     * @private
     */
    static _getLabel(path, pathsSchema) {
        const pathLabel = compact(path.replace(/[0-9]/ig, '').split('.'))
        const pathToDeep = pathLabel.join('.')
        return get(pathsSchema, `${pathToDeep}.options._label_`, HelperDiff._capitalizedKey(pathLabel[pathLabel.length - 1]))
    }
}

module.exports = HelperDiff
