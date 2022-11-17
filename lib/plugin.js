"use strict";
const Promise = require("bluebird");
const { HistoryLogModel } = require("./model");
const DeepDiff = require("./diffHelper");
const { isEmpty, get, assign, pick, set, cloneDeep } = require("lodash");
const mongoose = require('mongoose');
​
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
​
// used in case to throw error
class HttpError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}
​
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
​
var count = 0;
​
function HistoryPlugin(schema, options = {}) {
  /**
   * @author Welington Monteiro
   * @param { Object } loggedUser - Logged user from request
   */
  // schema.statics.addLoggedUser = function (loggedUser) {
  //   set(schema, "_loggedUser", loggedUser);
  // };
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
​
​
​
​
​
​
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
​
  /**
   * @auther Faraz & Rooshaan
   *
   */
​
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
​
  // schema.pre(/deleteOne|remove/, async function () {
  //   try {
  //     const collectionName = get(
  //       this,
  //       "mongooseCollection.modelName",
  //       get(this, "mongooseCollection.name", options.customCollectionName)
  //     );
  //     await initializeProcess.call(
  //       getCurrentUser.call(this, schema),
  //       _processPreRemove,
  //       options,
  //       collectionName
  //     );
  //   } catch (err) {
  //     console.log("\n\n\ndeleteOne|remove_error:", err);
  //     throw new HttpError("/deleteOne|remove/ log Hook Failed");
  //   }
  // });
​
  // schema.pre(/deleteMany/, async function () {
  //   try {
  //     const collectionName = get(
  //       this,
  //       "mongooseCollection.modelName",
  //       get(this, "mongooseCollection.name", options.customCollectionName)
  //     );
  //     await initializeProcess.call(
  //       getCurrentUser.call(this, schema),
  //       _processRemoveMany,
  //       options,
  //       collectionName
  //     );
  //   } catch (err) {
  //     console.log("\n\n\n/deleteMany_error: ", err);
  //     throw new HttpError("/deleteMany/ log Hook Failed");
  //   }
  // });
  // schema.pre(
  //   /remove/,
  //   {
  //     document: false,
  //     query: true,
  //   },
  //   async function () {
  //     try {
  //       const collectionName = get(
  //         this,
  //         "mongooseCollection.modelName",
  //         get(this, "mongooseCollection.name", options.customCollectionName)
  //       );
  //       await initializeProcess.call(
  //         getCurrentUser.call(this, schema),
  //         _processRemoveMany,
  //         options,
  //         collectionName
  //       );
  //     } catch (err) {
  //       console.log("/remove/_error: ", err);
  //       throw new HttpError("/remove/ log Hook Failed");
  //     }
  //   }
  // );
​
  // schema.post(
  //   /findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/,
  //   async function (doc) {
  //     try {
  //       const collectionName = doc.constructor.modelName;
  //       await initializeProcess.call(
  //         getCurrentUser.call(this, schema),
  //         _processPosRemove,
  //         options,
  //         doc,
  //         collectionName
  //       );
  //     } catch (err) {
  //       console.log(
  //         "/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/_err: ",
  //         err
  //       );
  //       throw new HttpError(
  //         "/findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/ log Hook Failed"
  //       );
  //     }
  //   }
  // );
​
  /**
   * Faraz Added
   */
//   schema.post("save", async function (doc) {
//     try {
//       const collectionName = doc.constructor.modelName;
//       await initializeProcess.call(
//         getCurrentUser.call(this, schema),
//         _processPosSave,
//         options,
//         doc,
//         collectionName
//       );
//     } catch (err) {
//       console.log("save_post_err: ", err);
//       throw new HttpError("/save_post/ log Hook Failed");
//     }
//   });
​
//   schema.post("insertMany", async function (docs) {
//     try {
//       const self = this;
//       const collectionName = docs.constructor;
//       await initializeProcess.call(
//         getCurrentUser.call(this, schema),
//         _processPosInsertMany,
//         options,
//         docs,
//         collectionName
//       );
//     } catch (err) {
//       console.log("Error_insertMany: ", err);
//       throw new HttpError("/Error_insertMany/ log Hook Failed");
//     }
//   });
​
//   // faraz Added  schema.post For update
// }
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
// async function initializeProcess(method, options, docs, collectionName) {
//   await method.call(this, options, docs, collectionName);
// }
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
​
function _toMongoId(string) {
  if (isEmpty(string)) {
    return {};
  }
  return mongoose.Types.ObjectId(string)
}
​
​
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
​
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
​
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
