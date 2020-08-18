'use strict'

const { diff } = require('deep-diff')
const { get, map, omit, startCase, camelCase, compact, concat } = require('lodash')
const ACTION = { N: 'Created', D: 'Deleted', E: 'Edited', A: 'Array' }
let changes = []

class HelperDiff {
    /**
     * @author welington Monteiro
     * @param { Object } [old] - Old object
     * @param { Object } [current] - Current object
     * @param { Object } [options] - options params
     * @return { Array } - list of changes
     */
    static getDiff({ old = {}, current = {} }, options = {}) {
        const omitPaths = get(options, 'omitPaths', [])
        const defaultOmitPaths = ['_id', '__v']
        old = omit(old, concat(omitPaths, defaultOmitPaths))
        current = omit(current, concat(omitPaths, defaultOmitPaths))
        changes = []

        const differences = diff(old, current)

        HelperDiff._mapItems(differences)
        return changes
    }

    /**
     * @author Welington Monteiro
     * @param { Array } diffs - deep diffs between old and current
     * @return {void}
     * @private
     */
    static _mapItems(diffs) {
        map(diffs, HelperDiff._addItem)
    }

    /**
     * @author Welington Monteiro
     * @param { Object } item - item to mapped fields
     * @param { String } path - path fields
     * @param { String } action - action mapped
     * @param { String } fieldItem - name field item mapped to object
     * @private
     */
    static _objectMapped({ item = '', path, action }, fieldItem) {
        map(item, (value, field) => {
            path += `.${field}`

            if (typeof value === 'object') {
                return HelperDiff._objectMapped({ path, item: value, action }, fieldItem)
            }
            const change = { from: '', to: '' }
            const label = HelperDiff._getLabel(path)

            change[`${fieldItem}`] = value
            changes.push({ ...change, path, action, label })
        })
    }

    /**
     * @author Welington Monteiro
     * @param { Object } item - item mapped deep diff
     * @private
     */
    static _addItem(item) {
        const to = get(item, 'rhs', get(item, 'item.rhs', ''))
        const path = item.path.join('.')
        const from = get(item, 'lhs', get(item, 'item.lhs', ''))
        let action = ACTION[get(item, 'kind', '')]

        if (action === 'Array') action = ACTION[get(item, 'item.kind', '')]

        if (typeof to === 'object') return HelperDiff._objectMapped({ path, item: to, action }, 'to')
        if (typeof from === 'object') return HelperDiff._objectMapped({ path, item: from, action }, 'from')
        const label = HelperDiff._getLabel(path)

        changes.push({ to, path, from, action, label })
    }

    /**
     * @author Welington Monteiro
     * @param { String } str  -string name to capitalize
     * @return {string} name field capitalized
     * @private
     */
    static _capitalizeObjectKey(str = '') {
        return startCase(camelCase(str))
    }

    static _getLabel(path) {
        const pathLabel = compact(path.replace(/[0-9]/, '').split('.'))
        return HelperDiff._capitalizeObjectKey(pathLabel[pathLabel.length - 1])
    }
}

module.exports = HelperDiff
