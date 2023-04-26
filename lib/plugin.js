'use strict';
const Promise = require('bluebird');
const { HistoryLogModel } = require('./model');
const DeepDiff = require('./diffHelper');
const { isEmpty, get, set } = require('lodash');
const mongoose = require('mongoose');

const resolveNestedObjectsForChanges = (object) => {
  Object.keys(object).forEach((key) => {
    if (key.includes('.') && key.split('.').length == 2) {
      const splitKey = key.split('.');
      object[splitKey[0]] = {
        ...(object[splitKey[0]] ? object[splitKey[0]] : {}),
        [splitKey[1]]: object[key],
      };
      delete object[key];
    }
  });
  return object;
};

// used in case to throw error
class HttpError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

var count = 0;

function HistoryPlugin(schema, options = {}) {
  /**
   * @author Welington Monteiro
   * @param { Object } loggedUser - Logged user from request
   */

  /**
   * @author welington Monteiro
   * @param { Object } [old] - old state json object
   * @param { Object } [current] - current state json object
   * @return {Array} changes -  return array changes diffs
   */
  schema.statics.getChangeDiffs = async function (old, current) {
    return _processGetDiffs.call(
      this,
      {
        old,
        current,
      },
      options
    );
  };
  /**
   * @author Welington Monteiro
   * @param { Object } params
   */
  schema.statics.createHistory = async function (params) {
    await _processCreateHistory.call(
      getCurrentUser.call(this, schema, params),
      params,
      options
    );
  };

  /**
   * @author Welington Monteiro
   * @param { Schema } schema - mongoose Schema
   * @param params
   * @return {getCurrentUser} - return this context with logged user
   */
  function getCurrentUser(schema, params) {
    const _loggedUser = get(schema, '_loggedUser', {});
    const loggedUser = get(params, 'loggedUser', {});
    this._loggedUser = _toJSON(
      !isEmpty(_loggedUser) ? _loggedUser : loggedUser
    );
    delete schema._loggedUser;
    return this;
  }
  /**
   * @author Welington Monteiro
   * @param { function } method - method call to process
   * @param { Object } options - params configuration before saved log
   * @param {Array | Object } docs - data document
   * @return {Promise<void>}
   */

  /**
   * @author Welington Monteiro
   * @param { Object } json - object transform
   * @return {Object} return object to json
   * @private
   */
  function _toJSON(json) {
    if (isEmpty(json)) {
      return {};
    }
    return JSON.parse(JSON.stringify(json));
  }

  function _toMongoId(string) {
    if (isEmpty(string)) {
      return {};
    }
    return mongoose.Types.ObjectId(string);
  }

  /**
   * @author Welington Monteiro
   * @param {Object} doc - doc
   * @return {{method: *, documentNumber: *, module: *, changes: *, loggedUser: *, action: *}}
   */
  function _mappedFieldsLog(doc = {}) {
    const actions = {
      updated: 'Edited Document',
      deleted: 'Removed Document',
      created: 'Created Document',
      undefined: 'No Defined',
      creatingMany: 'Created Document',
      deleteMany: 'Removed Document',
    };
    const { changes, module, documentNumber, method, user } = doc;
    const action = get(actions, `${method}`, method);
    return {
      changes,
      action,
      module,
      documentNumber,
      method,
      user,
    };
  }

  async function _saveHistoryLog(object, options, collectionName) {
    const NewOptions = {
      ...options,
      customCollectionName: collectionName
        ? `${options.customCollectionName}_${collectionName}`
        : `${options.customCollectionName}_${object.module}`,
    };

    // This is changes collection is multiple for saving
    if (object && Array.isArray(object)) {
      /**
       * We can loop through object array to check for document number , either remove that object from array or comlete stop the ongoing process
       */
      // if(get(object,"documentNumber") === undefined) return console.warn(`Not found documentNumber `)
      const HistoryLog = HistoryLogModel(NewOptions);
      return await HistoryLog.insertMany(object);
    } else {
      if (get(object, 'documentNumber') === undefined)
        return console.warn(`Not found documentNumber `);

      if (isEmpty(get(object, 'changes'))) {
        console.warn(
          'MONGOOSE-HISTORY-TRACE: path: {changes} no diffs documents.'
        );
        return;
      }
      if (
        isEmpty(get(object, 'user')) &&
        get(NewOptions, 'isAuthenticated', true)
      ) {
        console.warn(
          'MONGOOSE-HISTORY-TRACE: path: {user} is required. Example: Model.addLoggedUser(req.user)'
        );
        return;
      }
      const HistoryLog = HistoryLogModel(NewOptions);
      const history = new HistoryLog(object);
      return await history.save();
    }
  }

  /**
   * @author Welington Monteiro
   * @param { object } params
   * @param { Object } options - params configuration options plugin
   * @return {Array}
   * @private
   */
  async function _processGetDiffs(params, options) {
    const old = get(params, 'old', {});
    const current = get(params, 'current', {});
    return DeepDiff.getDiff(
      {
        old,
        current,
      },
      {},
      options
    );
  }
  /**
   * @author Welington Monteiro
   * @param { Object } options - params configuration options plugin
   * @param { Object } [params] - params paths to save history
   * @param { Object } [doc] - object to save
   * @param { String } method - name of method to save
   * @return { Object } - return object mounted to save
   */
  async function mountDocToSave({ options, params, doc }, method) {
    const self = this;
    let result = {};
    set(result, 'old', _toJSON(get(params, 'old', {})));
    set(result, 'current', _toJSON(get(params, 'current', {})));
    set(result, 'schema', get(self, 'schema'));
    set(result, 'user', _toMongoId(get(params, 'loggedUser')));
    set(
      result,
      'module',
      get(
        options,
        'moduleName',
        get(self, 'mongooseCollection.name', get(self, 'collection.name'))
      )
    );
    set(result, 'method', method || get(params, 'method', 'undefined'));
    if ({}.hasOwnProperty.call(self, 'isNew')) {
      result = await _helperPreSave.call(this, result);
    }
    if (!isEmpty(doc) && method === 'created') {
      result = _helperPosSaveWithDoc.call(this, result, doc);
    }
    if (method === 'updated') {
      result = await _helperPreUpdate.call(this, result);
    }
    set(
      result,
      'documentNumber',
      get(result, 'old._id', get(result, 'current._id'))
    );

    return result;
  }

  /**
   * @author Faraz ByteMage
   * @param { Object } options - params configuration options plugin
   * @param { Object } [params] - params paths to save history
   * @param { Object } [doc] - object to save
   * @param { String } method - name of method to save
   * @return { Object } - return object mounted to save
   */

  async function _helperPreSave(result) {
    const self = this;
    set(result, 'method', get(self, 'isNew') ? 'created' : 'updated');
    set(result, 'current', _toJSON(self.toObject ? self.toObject() : self));
    const _id = get(result, 'current._id');
    if (!self.isNew) {
      set(
        result,
        'old',
        _toJSON(
          await self.constructor.findOne({
            _id,
          })
        )
      );
    }
    return result;
  }

  function _helperPosSaveWithDoc(result, doc) {
    if (result.method === 'created') {
      set(result, 'current', _toJSON(doc.toObject ? doc.toObject() : doc));
    }
    if (result.method === 'deleted') {
      set(result, 'old', _toJSON(doc.toObject ? doc.toObject() : doc));
    }
    return result;
  }
  /**
   * @author Welington Monteiro
   * @param { Object } params - params to save history manually
   * @param { Object } options - params configuration before saved log
   * @return {Promise<void>}
   * @private
   */
  async function _processCreateHistory(params, options) {
    const { schema, user, module, method, old, current, documentNumber } =
      await mountDocToSave.call(this, {
        options,
        params,
      });
    const changes = DeepDiff.getDiff(
      {
        old,
        current,
      },
      schema,
      options
    );
    const docMapped = _mappedFieldsLog({
      changes,
      method,
      module,
      documentNumber,
      user,
    });

    await _saveHistoryLog(docMapped, options);
  }
}

module.exports = HistoryPlugin;
