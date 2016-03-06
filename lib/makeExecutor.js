"use strict";

// Takes a list of operations which compile to IO, and compile them, executing IO
// immediately when it appears. Exactly one interpreter must be provided for every
// non-IO algebra contained in the program or produced by the program's interpretation
//
// Mutates program

// TODO: Add composite manipulating functions, to enable the implementation in sample/domainInterpreters
// Also, add pluggable runtime typechecking

var makeComposite = require("./algebras").composite;

var inspect = require("util").inspect;

function show(x) {
  return inspect(x, { depth: null });
}

module.exports = function makeExecutor(interpreters) {

  function executeRecursive(program, environment, cb) {
    if (!program) return void cb(environment);

    if (!isComposite(program)) throw new Error("Execute was called with an argument that is not a composite");
    if (!program.body) throw new Error("Invalid composite");

    if (!program.body.operations || program.body.operations.length === 0) return void cb(environment);

    var op = program.body.operations.shift(),
        scopeVariable = null;

    function continueExecution() {
      setImmediate(executeRecursive, program, environment, cb);
    }

    if (typeof op === "object" && Object.keys(op).length === 1) { // We're binding to a name
      scopeVariable = Object.keys(op)[0];
      op = op[scopeVariable];

      if (environment[scopeVariable]) throw new Error("Tried to bind to variable |" + scopeVariable +
                                                      "|, but it was already defined in this scope");
    }

    if (typeof op === "function") {
      var result = op(environment);
      if (isReturnValue(result)) {
        if (scopeVarible) environment[scopeVariable] = result.body.value;
        return void continueExecution();
      }

      if (typeof result === "function") throw new Error("A function passed to a composite must return an operation");

      var wrappedResult = makeComposite([result]);

      return void executeRecursive(wrappedResult, {}, function (res) {
        if (scopeVarible) environment[scopeVariable] = res.body.value;
        return void continueExecution();
      });

    } else if (op.meta.type === "special") {

      if (op.meta.algebra === "io") {

        return void op.body.fn(function (ioResult) {
          if (scopeVariable) environment[scopeVariable] = ioResult;

          console.log('operation was an io');
          return void continueExecution();
        });

      } else if (isComposite(op)) {
          console.log('operation was a composite');
          return void setImmediate(executeRecursive, op, {}, function (res) {
            if (scopeVariable) environment[scopeVariable] = result;
            return void continueExecution();
          });

      } else if (isReturnValue(op)) {
        if (!op.body || !op.body.hasOwnProperty("value")) throw new Error(
          "Encountered invalid return operation: " + show(op));

        if (scopeVariable) environment[scopeVariable] = op.body.value;
        console.log('operation was a return value');
        return void continueExecution();

      } else {
        throw new Error("Unknown special op: " + show(op));
      }

    } else {

      console.log("gonna interpret a regular operation: " + show(op));

      if (!op.meta || !op.meta.algebra) throw new Error("Executor received an invalid operation: " + show(op));
      var interpreter = interpreters[op.meta.algebra];

      if (!interpreter) throw new Error(
        "Executor received operation that it does not have an interpreter for: " + show(op));

      // TODO: add typechecking based on interpreter's return type here later
      var result = interpreter(op);

      if (result === null || result === undefined) {
        if (scopeVariable) environment[scopeVariable] = result;
        return void continueExecution();

      } else if (isComposite(result)) {
        console.log('result of interpretation was a composite');
        return void setImmediate(executeRecursive, result, {}, function (res) {
          if (scopeVariable) environment[scopeVariable] = result;
          return void continueExecution();
        });

      } else if (isReturnValue(result)) {
          if (!result.body || !result.body.hasOwnProperty("value")) throw new Error(
            "Invalid return operation encountered: " + show(result));

          console.log("result of executing operation was a return value");
          if (scopeVariable) environment[scopeVariable] = result.body.value;
          return void continueExecution();

      } else throw new Error("Invalid result after executing operation: " + show(result) +
                             "\nSource operation: " + show(op));
    }
  }

  function initExecution (program, cb) {
    if (!isComposite(program)) program = makeComposite(program);
    executeRecursive(program, {}, cb);
  }

  return initExecution;
};

function isComposite(x) {
  return x && x.meta && x.meta.type === "special" && x.meta.operation === "composite";
}

function isReturnValue(x) {
  return x && x.meta && x.meta.type === "special" && x.meta.operation === "returning";
}

