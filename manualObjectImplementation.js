// This is an attempt to implement "composable interpreters" using plain JavaScript
// objects and functions, without a monad analogy

var testRunners = require("./testRunners"),
    inspect = require("util").inspect;

// Framework function to clean up this approach
function makeAlgebraElement(algebraName, operationName, args) {
  return function () {
    if (arguments.length !== args.length)
      throw new Error(
        "Called " + algebraName + "." + operationName + " with " + argments.length +
          " arguments; " + args.length + " arguments are expected");

    var body = {};
    if (args) {
      args.forEach(function(arg, i) {
        body[arg] = arguments[i];
      });
    }

    return {
      meta: {
        algebra: algebraName,
        operation: operationName
      },
      body: body
    };
  };
}

function makeAlgebra (algebraName, algebraElements) {
  var algebra = {};

  Object.keys(algebraElements).forEach(function(operationName) {
    var operationArguments = algebraElements[operationName];

    algebra[operationName] = makeAlgebraElement(algebraName, operationName, operationArguments);
  });

  return algebra;
}

// var fooAlgebra = makeAlgebra("foo", { bar: ["baz", "qux"] });
//
// expands to the equivalent of:
//
// var fooAlgebra = {
//   bar: function (baz, qux) {
//     return {
//       meta: {
//         algebra: "foo",
//         operation: "bar"
//       },
//       body: {
//         baz: baz,
//         qux: qux
//       }
//     };
//   }
// };
// There's no magic here, we just need constructors for objects of this schema

// This checks for error cases and lets us define handlers for the various operations
// in an algebra with a pseudo-pattern-match-y syntax
function makeInterpreter (inputAlgebra, operationHandlers) {
  return function interpreter (sourceOperation) {

    if (sourceOperation.meta.algebra !== inputAlgebra)
      throw new Error("Tried to interpret operation " +
                      inspect(sourceOperation, { depth: null }) +
                      " as an operation in the " +
                      inputAlgebra + " algebra");

    var op = cloudFileOperation.meta.operation,
        args = cloudFileOperation.body;

    operationHandlers[op](args);

    throw new Error("Tried to interpret unknown operation in '" +
                    inputAlgebra + "' algebra: " + op);
  };
}

// We use this to inject the mocks for our tests
function getSaveFile (mocks) {
  var externalLogger = mocks.logger,
      externalHttp = mocks.http;

  // Define the algebras
  var cloudFilesApi = makeAlgebra("cloudFiles", {
    saveFile: ["path", "bytes"],
    listFiles: ["path"]
  });

  var http = makeAlgebra("http", {
    get: ["path"],
    put: ["path", "bytes"],
    post: ["path", "bytes"],
    delete: ["path"]
  });

  var log = makeAlgebra("log", {
    log: ["level", "message"]
  });

  // Define the interpreters
  var logCloudFilesI = makeInterpreter({
    saveFile: function (args) {
      console.log("Saving file to " + args.path.show());
    },
    listFiles: function (args) {
      console.log("Listing files at " + args.path.show());
    }
  });



  function saveFile (path, file, callback) {
    log("Saving file " + path.name + " to " + path.parentDir, function () {
      post("cloudfiles.fooservice.com" + path.show(), file, function (postErr) {
        if (!postErr) {
          log("Successfully saved file " + path.show(), callback);
        } else {
          log("Failed to save file " + path.show(), function () {
            callback(postErr);
          });
        }
      });
    });
  }

  return saveFile;
}

console.log("Run expecting success:")
testRunners.runFileSave(getSaveFile);
console.log("\n\nRun expecting error:")
testRunners.runFileSaveWithError(getSaveFile);
