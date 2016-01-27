
var builtInAlgebras = require("../lib/algebras");

var algebras = require("./coreAlgebras"),
    authorization = algebras.authorization,
    errors = algebras.errors,
    userRecords = algegras.userRecords;  // An algebra that separately compiles to DB operations

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
    { isValidToken: authorization.tokenIsValid(authToken) },
    { isAuthed: authorization.matchId(userId, authToken) },

    // args contains the results of all previous operations in this composite which have been named
    function (args, cb) {
      // We know that errors have the semantics of stopping execution, so this is all
      // we have to do here.
      if (!args.isValidToken || !args.isAuthed)
        return void cb(errors.authorization(authToken, userId));

      void cb();
    },
    { writeStatus: userRecords.updateField(userId, "emailAddress", emailAddress) },

    // When we find a function in the operation list, we execute it to get its operation.
    // if it calls back with null, we ignore it. Don't do side effects in here.
    function (args, cb) {
      if (args.writeStatus.error) return void cb(errors.internalServer(args.writeStatus.error));

      // I don't really like this. We should figure out a way to use internal statuses,
      // that correspond to our domain model and are composable, and then map them to HTTP statuses
      // in middleware.
      // This would demonstrate using multiple levels of interpreters?
      return builtInAlgebras.returning({
        status: 200
      });
    }
  ]);

  return program;
};

