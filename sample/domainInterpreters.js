"use strict";

// Interpreters to get this example to work. Most of these are just sketches
// of functionality to show how the interfaces and responsibilities will look
// for this example

var makeInterpreter = require("../lib/makeInterpreter"),
    builtInAlgebras = require("../lib/algebras");

var algebras = require("./algebras");

var inspect = require("util").inspect;

var authorization = makeInterpreter("authorization", {
  isValidToken: function (args, cb) {
    var token = args.token;

    // Pretend I'm checking a signature here
    cb(null, token.isValid === true);
  },
  isAuthed: function (args, cb) {
    var userId = args.userId,
        token = args.token;

    cb(null, token && token.userId === userId);
  }
});

// Here is where I need to invent a way for interpreters to manipulate the remaining part of this
// composite
//
// I'm not certain that this will be the final interface, but I think the final interface should
// have these capabilities: calling composite.get() will give you a deep copy of the remaining
// composite, and calling composite.replace(prog) will replace the remaining composite with prog
var errors = makeInterpreter("errors", {
  authorization: function (args, cb, composite) {
    var identity = args.identity,
        requestedResource = args.requestedResource,
        message = "User " + identity + " does not have access to resource " + requestedResource;

    // An algebra whose interpreter is constantly defined as exiting the current composite
    // and returning the value it was instantiated with as the composite's response
    composite.replace([builtInAlgebras.returning({
      status: 401,
      body: message
    })]);

    cb();
  },
  internalServer: function (args, cb, composite) {
    var message = args.sourceError;

    // I'm not sold that returning http errors is best here... I think there may be a more
    // composable solution, but I'm not gonna obsess over it ATM
    composite.replace([builtInAlgebras.returning({
      status: 500,
      body: message
    })]);

    cb();
  }
});

var userRecords = makeInterpreter("userRecords", {
  updateField: function (args, cb) {
    var entityId = args.entityId,
        fieldName = args.fieldName,
        fieldValue = args.fieldValue,
        upsertPayload = {};

    upsertPayload[fieldName] = fieldValue;

    cb(null, algebras.database.upsert("users", entityId, upsertPayload));
  }
});

var database = makeInterpreter("coconutDb/dbOperations", {
  upsert: function (args, cb) {
    var tableName = args.table,
        entityId = args.id,
        updatedField = args.patch,
        field = Object.keys(updatedField)[0],
        value = updatedField[field];

    cb(null, builtInAlgebras.io.run(function (cb) {
      // This is where we would interface with an actual DB driver
      console.log("operating on the database: UPSERT " + field + " = " + value +
                  " WHERE id = " + entityId);
      cb();
    }));
  }
});

var logging = makeInterpreter("log", {
  log: function (args, cb) {
    var message = args.message;

    cb(null, builtInAlgebras.io.run(function (cb) {
      console.log("LOG: " + message);
    }));
  },
  warn: function (args, cb) {
    var message = args.message;

    cb(null, builtInAlgebras.io.run(function (cb) {
      console.log("WARN: " + message);
    }));
  },
  error: function (args, cb) {
    var message = args.message;

    cb(null, builtInAlgebras.io.run(function (cb) {
      console.log("ERROR: " + message);
      cb();
    }));
  }
});

var apiResponses = makeInterpreter("someRestFramework/respond", {
  respond: function (args, cb) {
    var result = args.responseDescriptor,
        responseObj = args.frameworkResponseObject;

    cb(null, builtInAlgebras.io.run(function (cb) {
      console.log("Calling response.send with argument: " + inspect(result, { depth: null }));
      cb();
    }));
  }
});

module.exports = {
  authorization: authorization,
  errors: errors,
  userRecords: userRecords,
  apiResponses: apiResponses,
  database: database,
  logging: logging
};

