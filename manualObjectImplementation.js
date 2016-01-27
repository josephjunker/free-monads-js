"use strict";

// This is an attempt to implement "composable interpreters" using plain JavaScript
// objects and functions, without a monad analogy

var testRunners = require("./testRunners"),
    inspect = require("util").inspect;

// Framework function to clean up this approach
function makeAlgebraElement(algebraName, operationName, args) {
  return function () {
    var passedArgs = Array.prototype.slice.call(arguments);

    if (passedArgs.length !== args.length)
      throw new Error(
        "Called " + algebraName + "." + operationName + " with " + argments.length +
          " arguments; " + args.length + " arguments are expected");

    var body = {};
    if (args) {
      args.forEach(function(arg, i) {
        body[arg] = passedArgs[i];
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

    var op = sourceOperation.meta.operation,
        args = sourceOperation.body,
        handler = operationHandlers[op];

    if (!handler) throw new Error(
      "Tried to interpret unknown operation in '" +
      inputAlgebra + "' algebra: " + inspect(op, { depth: null }));

    return handler(args);
  };
}

// Our "base" algebra-- interpreters create io instances with functions in order to execute
// side effects. The function passed into this must take a callback and execute it exactly
// once

var io = {
  run: function (fn) {
    return {
      meta: {
        type: "special",
        algebra: "io",
        operation: "run"
      },
      body: {
        fn: fn
      }
    };
  }
};

// Trying to figure out how to move things into a monadic context-- this is
// an attempt to define something which affects the control flow of the rest of the program
//
// This will make me have to change how execute operation runs-- it may need to not
// de-nest composite operations
var controlFlow = {
  error: function (errValue) {
    return {
      meta: {
        algebra: "controlFlow",
        operation: "error"
      },
      body: {
        value: errValue
      },
      // Should be on a prototype, refactor later
      getNextOperation: function (lastResult, args) {
        return controlFlow.exitError(args.value);
      }
    };
  },
};

// If an interpreter produces more than one operation for a given input,
// it puts them in this
function multiOperation(ops) {
  return {
    meta: {
      type: "special",
      algebra: "composite",
      operation: "composite"
    },
    body: {
      operations: ops
    }
  };
}

// Takes a list of operations which compile to IO, and compile them, executing IO
// immediately when it appears. Exactly one interpreter must be provided for every
// non-IO algebra contained in the program or produced by the program's interpretation
//
// Mutates program
function makeExecutor(interpreters) {

  function executeRecursive(program, cb) {
    if (!Array.isArray(program)) throw new Error(
      "Executor was called with a non-array as a program. " +
      "The provided program was: " + program);

    if (!program.length) return void cb();

    var op = program.shift();

    if (op.meta.type === "special") {
      if (op.meta.algebra === "io") {

        return void op.body.fn(function () {
          var args = Array.prototype.slice.call(arguments),
              newProgram = args.concat(program);

          return void setImmediate(executeRecursive, newProgram, cb);
        });

      } else if (op.meta.algebra === "composite") {

        var ops = op.body.operations,
            newProgram = ops.concat(program);

        return void setImmediate(executeRecursive, newProgram, cb);

      } else {
        throw new Error("Unknown special op: " + inspect(op, { depth: null }));
      }

    } else {

      var interpreter = interpreters[op.meta.algebra];

      if (!interpreter) throw new Error(
        "Executor received operation that it does not have an interpreter for: " +
        inspect(op, { depth: null }));

      var compiledOp = interpreter(op);

      program.unshift(compiledOp);
      return void setImmediate(executeRecursive, program, cb);
    }
  }

  return executeRecursive;
}


/*--------------- End framework functions ---------------*/



// We use this to inject the mocks for our tests
function getSaveFile (mocks) {
  var externalLogger = mocks.logger,
      externalHttp = mocks.http;

  // Define the algebras
  var cloudFiles = makeAlgebra("cloudFiles", {
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
  var cloudFilesToHttpI = makeInterpreter("cloudFiles", {
    saveFile: function (args) {
      var path = args.path,
          bytes = args.bytes;

      return http.post("cloudFiles.fooService.com/" + path.name, bytes);
    },
    listFiles: function (args) {
      var path = args.path;

      return http.get("cloudFiles.fooService.com/" + path.name);
    }
  });

  var httpToIoWithErrorsI = makeInterpreter("http", {
    get: function (args) {
      return io.run(function (cb) {
        externalHttp.get(args.path, function (err, result) {
          if (err) return void cb(http.error(err));
        });
      });
    }
  });

  var httpToIoI = makeInterpreter("http", {
    get: function (args) {
      return io.run(function (cb) {
        externalHttp.get(args.path, cb);
      });
    },
    put: function (args) {
      return io.run(function (cb) {
        externalHttp.put(args.path, args.bytes, cb);
      });
    },
    post: function (args) {
      return io.run(function (cb) {
        externalHttp.post(args.path, args.bytes, cb);
      });
    },
    delete: function (args) {
      return io.run(function (cb) {
        externalHttp.delete(args.path, cb);
      });
    }
  });

  var cloudFilesToLogI = makeInterpreter("cloudFiles", {
    saveFile: function (args) {
      var path = args.path;

      return log.log("log", "Saving a file to " + path.name);
    },
    listFiles: function (args) {
      var path = args.path;

      return log.log("log", "Listing files at " + path.name);
    }
  });

  function cloudFilesToLogAndHttpI(operation) {
    var logOp = cloudFilesToLogI(operation),
        httpOp = cloudFilesToHttpI(operation);

    return multiOperation([logOp, httpOp]);
  }

  var logToIoI = makeInterpreter("log", {
    log: function (args) {
      var level = args.level,
          message = args.message;

      return io.run(function (cb) {
        console.log(level + ": " + message);
        cb();
      });
    }
  });

  var executor = makeExecutor({
    cloudFiles: cloudFilesToLogAndHttpI,
    http: httpToIoI,
    log: logToIoI
  });

  function saveFile (path, file, callback) {
    var program = [cloudFiles.saveFile(path, file)];
    executor(program, callback);
  }

  return saveFile;
}

testRunners.runFileSave(getSaveFile);
