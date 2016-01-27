"use strict";

// Takes a list of operations which compile to IO, and compile them, executing IO
// immediately when it appears. Exactly one interpreter must be provided for every
// non-IO algebra contained in the program or produced by the program's interpretation
//
// Mutates program
module.exports = function makeExecutor(interpreters) {

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
};
