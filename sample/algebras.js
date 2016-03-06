"use strict";

var makeAlgebra = require("../lib/makeAlgebra");

// I've only implemented the algebra elements that are necessary for this example
// to run here. In a real application I would expect more operations to be
// defined in each of these. I would also expect that some algebras, like one for
// sending an api response from express or a similar framework, or one for interfacing
// with a particular database, would be written as external packages


// The "returns" flag is something that I didn't think of when writing the
// first prototype. In cases where we expect a sequence of operations to
// return a usable, non-operation value, we should specify this. It will be
// checked dynamically. Types should be implemented as a function that we pass
// the given type label and the actual result data to, enabling any type system
// (or the lack thereof) to be chosen by the caller, orthogonal to this library

var authorization = makeAlgebra("authorization", {
  isValidToken: ["token", { returns: "boolean" }],
  isAuthed: ["userId", "token", { returns: "boolean" }],
  doesTokenMatchUserId: ["token", "userId", { returns: "boolean" }]
});

var errors = makeAlgebra("errors", {
  authorization: ["identity", "requestedResource"],
  internalServer: ["sourceError"]
});

var userRecords = makeAlgebra("userRecords", {
  // return value has "error" field if there was an error
  updateField: ["entityId", "fieldName", "fieldValue", { returns: "object" }]
});

// Pretend this is exported from a third party library instead of implemented here.
// Algebra libraries should namespace themselves like this to prevent collisions.
// Eventually, providing a utility function to alias the name of an algebra would
// be valuable to prevent collisions
var db = makeAlgebra("coconutDb/dbOperations", {
  upsert: ["table", "id", "patch"]
});

var logging = makeAlgebra("log", {
  log: ["message"],
  warn: ["message"],
  error: ["message"]
});

var apiResponses = makeAlgebra("someRestFramework/respond", {
  respond: ["responseDescriptor", "frameworkResponseObject"]
});

module.exports = {
  authorization: authorization,
  errors: errors,
  userRecords: userRecords,
  apiResponses: apiResponses,
  database: db,
  logging: logging
};

