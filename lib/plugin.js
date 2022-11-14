"use strict";
const Promise = require("bluebird");
const { HistoryLogModel } = require("./model");
const DeepDiff = require("./diffHelper");
const { isEmpty, get, assign, pick, set, cloneDeep } = require("lodash");

const resolveNestedObjectsForChanges = (object) => {
  Object.keys(object).forEach((key) => {
    if (key.includes(".") && key.split(".").length == 2) {
      const splitKey = key.split(".");
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

/**
 *
 * @param { mongoose } schema - schema mongoose
 * @param { Object } options
 * @example {
 *   userPaths: []                              //name paths user to saved on logs
 *   isAuthenticate: true                       //default is true
 *   customCollectionName: String               //default is collection name
 *   connectionUri: String                      //default is connection of collection
 *   moduleName: String                         //default is collection name
 *   indexes: [
 *        {'path': 1},                          //paths create index on history log collection
 *        {'path': -1},
 *        {'path': 'text'}
 *   ]
 *   omitPaths: ['_id', '__v']                  //paths omit on created history log
 *   addCollectionPaths: [                      //add paths in collection history log
 *      {key: 'path1', value: 'String' },       //    key - name path
 *      {key: 'path2', value: 'String' },       //    value - mongoose types .('ObjectId', 'Mixed', 'String', 'Number', etc)
 *      {key: 'path3.path2',                    //    sudoc : {key: 'field.subdoc', value: 'String'}
 *          value: 'ObjectId' },
 *   ],
 *   changeTransform: {
 *     to: 'newPathToView'                      //new value to path 'to' transform to view
 *     from: 'newPathToView'                    //new value to path 'from' transform to view
 *     label: 'newPathToView'                   //new value to path 'label' transform to view
 *     ops: 'newPathToView'                     //new value to path 'ops' transform to view
 *     path: 'newPathToView'                    //new value to path 'path' transform to view
 *   }
 *
 * }
 */

var count = 0;

function HistoryPlugin(schema, options = {}) {
  /**
   * @author Welington Monteiro
   * @param { Object } loggedUser - Logged user from request
   */
  schema.statics.addLoggedUser = function (loggedUser) {
    set(schema, "_loggedUser", loggedUser);
  };
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
    // console.warn(params);
    await _processCreateHistory.call(
      getCurrentUser.call(this, schema, params),
      params,
      options
    );
  };






  // schema.pre(
  //   /update|updateOne|findOneAndUpdate|findByIdAndUpdate|findOneAndReplace|replaceOne/,
  //   async function () {
  //     try {
  //       if (get(this, "op") != "updateMany") {
  //         const collectionName = get(
  //           this,
  //           "mongooseCollection.modelName",
  //           get(this, "mongooseCollection.name", options.customCollectionName)
  //         );
  //         await initializeProcess.call(
  //           getCurrentUser.call(this, schema),
  //           _processPreUpdate,
  //           options,
  //           collectionName
  //         );
  //       }
  //     } catch (err) {
  //       console.log("update/replace_err: ", err);
  //       throw new HttpError("Update log Hook Failed");
  //     }
  //   }
  // );

  /**
   * @auther Faraz
   *
   */

  // write wrapper for try catch
  // schema.pre(/updateMany/, async function () {
  //   try {
  //     const collectionName = get(
  //       this,
  //       "mongooseCollection.modelName",
  //       get(this, "mongooseCollection.name", options.customCollectionName)
  //     );
  //     if (get(this, "op") == "updateMany") {
  //       await initializeProcess.call(
  //         getCurrentUser.call(this, schema),
  //         _processPreUpdateMany,
  //         options,
  //         collectionName
  //       );
  //     }
  //   } catch (err) {
  //     console.log("errPlease: ", err);
  //     // this is to throw error if logs saved failed
  //     throw new HttpError("Update Many log Hook Failed");
  //   }
  // });

  schema.pre(/deleteOne|remove/, async function () {
    try {
      const collectionName = get(
        this,
        "mongooseCollection.modelName",
        get(this, "mongooseCollection.name", options.customCollectionName)
      );
      await initializeProcess.call(
        getCurrentUser.call(this, schema),
        _processPreRemove,
        options,
        collectionName
      );
    } catch (err) {
      console.log("\n\n\ndeleteOne|remove_error:", err);
      throw new HttpError("/deleteOne|remove/ log Hook Failed");
    }
  });

  schema.pre(/deleteMany/, async function () {
    try {
      const collectionName = get(
        this,
        "mongooseCollection.modelName",
        get(this, "mongooseCollection.name", options.customCollectionName)
      );
      await initializeProcess.call(
        getCurrentUser.call(this, schema),
        _processRemoveMany,
        options,
        collectionName
      );
    } catch (err) {
      console.log("\n\n\n/deleteMany_error: ", err);
      throw new HttpError("/deleteMany/ log Hook Failed");
    }
  });
  schema.pre(
    /remove/,
    {
      document: false,
      query: true,
    },
    async function () {
      try {
        const collectionName = get(
          this,
          "mongooseCollection.modelName",
          get(this, "mongooseCollection.name", options.customCollectionName)
        );
        await initializeProcess.call(
          getCurrentUser.call(this, schema),
          _processRemoveMany,
          options,
          collectionName
        );
      } catch (err) {
        console.log("/remove/_error: ", err);
        throw new HttpError("/remove/ log Hook Failed");
      }
    }
  );

  schema.post(
    /findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/,
    async function (doc) {
      try {
        const collectionName = doc.constructor.modelName;
        await initializeProcess.call(
          getCurrentUser.call(this, schema),
          _processPosRemove,
          options,
          doc,
          collectionName
        );
      } catch (err) {
        console.log(
          "/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/_err: ",
          err
        );
        throw new HttpError(
          "/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/ log Hook Failed"
        );
      }
    }
  );

  /**
   * Faraz Added
   */
  schema.post("save", async function (doc) {
    try {
      const collectionName = doc.constructor.modelName;
      await initializeProcess.call(
        getCurrentUser.call(this, schema),
        _processPosSave,
        options,
        doc,
        collectionName
      );
    } catch (err) {
      console.log("save_post_err: ", err);
      throw new HttpError("/save_post/ log Hook Failed");
    }
  });

  schema.post("insertMany", async function (docs) {
    try {
      const self = this;
      const collectionName = docs.constructor;
      await initializeProcess.call(
        getCurrentUser.call(this, schema),
        _processPosInsertMany,
        options,
        docs,
        collectionName
      );
    } catch (err) {
      console.log("Error_insertMany: ", err);
      throw new HttpError("/Error_insertMany/ log Hook Failed");
    }
  });

  // faraz Added  schema.post For update
}
/**
 * @author Welington Monteiro
 * @param { Schema } schema - mongoose Schema
 * @param params
 * @return {getCurrentUser} - return this context with logged user
 */
function getCurrentUser(schema, params) {
  const _loggedUser = get(schema, "_loggedUser", {});
  const loggedUser = get(params, "loggedUser", {});
  this._loggedUser = _toJSON(!isEmpty(_loggedUser) ? _loggedUser : loggedUser);
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
async function initializeProcess(method, options, docs, collectionName) {
  await method.call(this, options, docs, collectionName);
}
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
/**
 * @author Welington Monteiro
 * @param {Object} doc - doc
 * @return {{method: *, documentNumber: *, module: *, changes: *, loggedUser: *, action: *}}
 */
function _mappedFieldsLog(doc = {}) {
  const actions = {
    updated: "Edited Document",
    deleted: "Removed Document",
    created: "Created Document",
    undefined: "No Defined",
    creatingMany: "Created Document",
    deleteMany: "Removed Document",
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
/**
 *@author Welington Monteiro
 * @param { Object } object - object mapped to saved
 * @param { Object } options - params configuration before saved log
 */
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
    if (get(object, "documentNumber") === undefined)
      return console.warn(`Not found documentNumber `);

    if (isEmpty(get(object, "changes"))) {
      console.warn(
        "MONGOOSE-HISTORY-TRACE: path: {changes} no diffs documents."
      );
      return;
    }
    if (
      isEmpty(get(object, "user")) &&
      get(NewOptions, "isAuthenticated", true)
    ) {
      console.warn(
        "MONGOOSE-HISTORY-TRACE: path: {user} is required. Example: Model.addLoggedUser(req.user)"
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
  const old = get(params, "old", {});
  const current = get(params, "current", {});
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
  set(result, "old", _toJSON(get(params, "old", {})));
  set(result, "current", _toJSON(get(params, "current", {})));
  set(result, "schema", get(self, "schema"));
  set(
    result,
    "user",
    get(params, "loggedUser")
  );
  set(
    result,
    "module",
    get(
      options,
      "moduleName",
      get(self, "mongooseCollection.name", get(self, "collection.name"))
    )
  );
  set(result, "method", method || get(params, "method", "undefined"));
  if ({}.hasOwnProperty.call(self, "isNew")) {
    result = await _helperPreSave.call(this, result);
  }
  if (!isEmpty(doc) && method === "created") {
    result = _helperPosSaveWithDoc.call(this, result, doc);
  }
  if (method === "updated") {
    result = await _helperPreUpdate.call(this, result);
  }
  set(
    result,
    "documentNumber",
    get(result, "old._id", get(result, "current._id"))
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
async function mountDocToSaveMany({ options, params, doc }, method) {
  const self = this;
  let result = {};
  set(result, "old", _toJSON(get(params, "old", {})));
  set(result, "current", _toJSON(get(params, "current", {})));
  set(result, "schema", get(self, "schema"));
  set(
    result,
    "user",
    pick(get(self, "_loggedUser"), get(options, "userPaths", []))
  );
  set(
    result,
    "module",
    get(
      options,
      "moduleName",
      get(self, "mongooseCollection.name", get(self, "collection.name"))
    )
  );
  set(result, "method", method || get(params, "method", "undefined"));
  if ({}.hasOwnProperty.call(self, "isNew")) {
    result = await _helperPreSave.call(this, result);
  }

  if (!isEmpty(doc) && method === "deleteMany" && Array.isArray(doc)) {
    return _helperPostSaveMany(result, options, doc, method);
  }

  if (!isEmpty(doc) && method === "creatingMany" && Array.isArray(doc)) {
    return _helperPostSaveMany(result, options, doc, method);
  }

  if (!isEmpty(doc)) {
    result = _helperPosSaveWithDoc.call(this, result, doc);
    return result;
  }
  if (method === "updateMany") {
    return await _helperPreUpdateMany.call(this, result, options);
  }
}

async function _helperPostSaveMany(result, options, docs, method1) {
  return await Promise.map(docs, async (eachDoc) => {
    const resultClone = {};

    if (isEmpty(eachDoc)) {
      return;
    }
    const jsonEachDoc = _toJSON(
      eachDoc.toObject ? eachDoc.toObject() : eachDoc
    );
    set(resultClone, "method", method1);

    set(resultClone, "documentNumber", get(jsonEachDoc, "_id"));
    set(resultClone, "current", jsonEachDoc);

    const { schema, user, module, method, old, current, documentNumber } =
      resultClone;

    const changes = DeepDiff.getDiff(
      {
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

    return docMapped;
    // Take this option out of this map , push docMapped , options into array and than send that array
    //  out to _saveHistoryLog() if neccessary make another function
    // return await _saveHistoryLog(docMapped, options);
  });
}

/**
 * @author Welington Monteiro
 * @param { Object } result - result Object mount paths to save
 * @return { Object } - return object mount
 * @private
 */
async function _helperPreSave(result) {
  const self = this;
  set(result, "method", get(self, "isNew") ? "created" : "updated");
  set(result, "current", _toJSON(self.toObject ? self.toObject() : self));
  const _id = get(result, "current._id");
  if (!self.isNew) {
    set(
      result,
      "old",
      _toJSON(
        await self.constructor.findOne({
          _id,
        })
      )
    );
  }
  return result;
}
/**
 * @author Welington Monteiro
 * @param { Object } result - result Object mount paths to save
 * @return { Object } - return object mount
 * @private
 */
async function _helperPreUpdate(result) {
  const self = this;
  const query = get(self, "_conditions");
  if (isEmpty(query)) {
    return console.warn(
      `Not found documents to ${result.method} history logs.`
    );
  }
  // shoud'nt this be findMany
  const old = _toJSON(await self.findOne(query).clone());
  if (isEmpty(old)) {
    return console.warn(
      `Not found documents to ${result.method} history logs.`
    );
  }
  const mod = _toJSON(get(self, "_update.$set", get(self, "_update")));

  set(result, "old", old);
  set(
    result,
    "current",
    assign({}, old, resolveNestedObjectsForChanges(cloneDeep(mod)))
  );
  return result;
}

/**
 * @author Faraz Shahid
 * @param { Object } result - result object mount paths to save
 * @private
 */

async function _helperPreUpdateMany(result, options) {
  const self = this;
  const query = get(self, "_conditions");
  if (isEmpty(query)) {
    return console.warn(
      `Not found documents to ${result.method} history logs.`
    );
  }
  const oldArray = _toJSON(await self.find(query).clone());
  return await Promise.map(oldArray, async (eachDoc) => {
    const resultClone = {
      ...cloneDeep(result),
    };

    if (isEmpty(eachDoc)) {
      return console.warn(
        `Not found documents to ${resultClone.method} history logs.`
      );
    }

    // faraz Bytemage
    /* initially this line 
        // const mod = _toJSON(get(self, '_update.$set', get(self, '_update')))
        //  this line 
        // await this.scheduleModel.updateMany({ _id: { $in: ids } }, { isDeleted: true, deletedAt: new Date() }) in sechedule.service 
          so basically { isDeleted } line does not comes in self, _update.$set rather comes in _update so isDelete change does not comes in logs
          to avoid this glitch modified the lines
          some places bilal ha used $set but not in case of isDeleted why??
        await this.scheduleModel.updateMany({ _id: { $in: ids } }, { $set: { employee } })

        // 
        */
    const { $set = {}, ..._update } = get(self, "_update");
    const mod = _toJSON({
      ..._update,
      ...$set,
    });

    set(resultClone, "old", eachDoc);
    set(resultClone, "current", assign({}, eachDoc, mod));
    set(
      resultClone,
      "documentNumber",
      get(resultClone, "old._id", get(resultClone, "current._id"))
    );
    const { schema, user, module, method, old, current, documentNumber } =
      resultClone;

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
    return docMapped;
    // Take this option out of this map , push docMapped , options into array and than send that array
    //  out to _saveHistoryLog() if neccessary make another function
    // return await _saveHistoryLog(docMapped, options);
  });
}

/**
 *
 * @param { Object } result - result Object mount paths to save
 * @param { Object } doc - object to save
 * @return { Object } - return object mount
 * @private
 */
function _helperPosSaveWithDoc(result, doc) {
  if (result.method === "created") {
    set(result, "current", _toJSON(doc.toObject ? doc.toObject() : doc));
  }
  if (result.method === "deleted") {
    set(result, "old", _toJSON(doc.toObject ? doc.toObject() : doc));
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
/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processRemoveMany(options, collectionName) {
  const query = get(this, "_conditions");
  const olds = _toJSON(await this.find(query).clone());
  return await _processPosRemoveMany.call(
    this,
    options,
    olds,
    "deleteMany",
    collectionName
  );

  // Promise.map(olds, async (eachOld) => await _processPosRemove.call(this, options, eachOld))
}

/**
 * @author Welington Monteiro
 * @param { Array } docs - List of document inserted
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosInsertMany(options, docs, collectionName) {
  return await _processPosSaveMany.call(
    this,
    options,
    docs,
    "creatingMany",
    collectionName
  );
}

/**
 * @author Faraz ByteMage
 * @param { Object } options - params configuration before saved log
 * @return {Promise<*>}
 */
async function _processPosSaveMany(options, doc, method, collectionName) {
  const mountDocToSave = await mountDocToSaveMany.call(
    this,
    {
      options,
      doc,
    },
    method
  );
  await _saveHistoryLog(mountDocToSave, options, collectionName);
}

/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreRemove(options, collectionName) {
  const query = get(this, "_conditions");
  const old = _toJSON(await this.findOne(query));
  await _processPosRemove.call(this, options, old, collectionName);
}
/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @return {Promise<*>}
 */
async function _processPreUpdate(options, collectionName) {
  const { schema, user, module, method, old, current, documentNumber } =
    await mountDocToSave.call(
      this,
      {
        options,
      },
      "updated"
    );

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
  await _saveHistoryLog(docMapped, options, collectionName);
}

/**
 * @author Faraz ByteMage
 * @param { Object } options - params configuration before saved log
 * @return {Promise<*>}
 */
async function _processPreUpdateMany(options, collectionName) {
  const mountDocToSave = await mountDocToSaveMany.call(
    this,
    {
      options,
    },
    "updateMany"
  );
  await _saveHistoryLog(mountDocToSave, options, collectionName);
}
/**
 * @author Welington Monteiro
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPreSave(options) {
  const { schema, user, module, method, old, current, documentNumber } =
    await mountDocToSave.call(this, {
      options,
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
/**
 * @author Welington Monteiro
 * @param doc
 * @param { Object } options - params configuration before saved log
 * @private
 */
async function _processPosSave(options, doc, collectionName) {
  const { schema, user, module, method, current, documentNumber } =
    await mountDocToSave.call(
      this,
      {
        options,
        doc,
      },
      "created"
    );
  const changes = DeepDiff.getDiff(
    {
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
  await _saveHistoryLog(docMapped, options, collectionName);
}
/**
 * @author Welington Monteiro
 * @param { Object } doc - object mapped
 * @param { Object } options - params configuration before saved log
 * @return {Promise<void>}
 */
async function _processPosRemove(options, doc, collectionName) {
  const { schema, user, module, method, old, documentNumber } =
    await mountDocToSave.call(
      this,
      {
        options,
        doc,
      },
      "deleted"
    );
  const changes = DeepDiff.getDiff(
    {
      old,
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
  await _saveHistoryLog(docMapped, options, collectionName);
}

async function _processPosRemoveMany(options, doc, collectionName) {
  const mountDocToSave = await mountDocToSaveMany.call(
    this,
    {
      options,
      doc,
    },
    "deleteMany"
  );
  await _saveHistoryLog(mountDocToSave, options, collectionName);
}

module.exports = HistoryPlugin;
