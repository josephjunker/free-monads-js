"use strict";

// This file is what a route endpoint would look like in an express-like app using this framework

var builtInAlgebras = require("../").algebras;

var algebras = require("./algebras"),
    authorization = algebras.authorization,
    errors = algebras.errors,
    userRecords = algebras.userRecords;  // An algebra that separately compiles to DB operations

// Contrived example-- we want to make sure a user can change their address,
// and then change it. I know that in reality you wouldn't want to do authorization inside
// every route, but I needed to add some complexity in here

// Instead of executing the program here, we just return it, and assume that middleware will
// run it with a set of interpreters standard to our app-- interpereters and algebras form
// our domain model
module.exports = function changeUserEmailAddress(userId, authToken, emailAddress) {

  // Composite will serve to namespace the set of operations-- only the return value of
  // the last operation will be visible to programs which execute this program, so
  // we can use local name bindings without leaking information
  var program = builtInAlgebras.composite([
    // We wrap operations in objects to bind their results to names, scoped to the composite
    { isValidToken: authorization.isValidToken(authToken) },
    { isAuthed: authorization.doesTokenMatchUserId(authToken, userId) },

    // args contains the results of all previous operations in this composite which have been named
    function (args) {
      console.log("executed function from changeEmail");
      // We know that errors have the semantics of stopping execution, so this is all
      // we have to do here.
      if (!args.isValidToken || !args.isAuthed)
        return errors.authorization(authToken, userId);
    },
    { writeStatus: userRecords.updateField(userId, "emailAddress", emailAddress) },

    // When we find a function in the operation list, we execute it to get its operation.
    // if it calls back with null, we ignore it. Don't do side effects in here.
    // If you want to return a value instead of an operation from a function, you need to wrap
    // it in an instance of the "returning" algebra
    function (args, cb) {
      if (args.writeStatus.error) return errors.internalServer(args.writeStatus.error);

      return builtInAlgebras.returning({
        status: 200
      });
    }
  ]);

  return program;
};

