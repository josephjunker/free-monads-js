"use strict";

var inspect = require('util').inspect;

function show(x) {
  return inspect(x, { depth: null });
}

function quote(string) {
  return "|" + string + "|";
}

module.exports = function makeInterpreter (inputAlgebra, operationHandlers) {
  return function interpreter (sourceOperation, overwrite) {

    if (sourceOperation.meta.algebra !== inputAlgebra)
      throw new Error(["Tried to interpret operation", show(sourceOperation),
                       "as an operation in the", inputAlgebra, "algebra, but it belongs to the",
                       sourceOperation.meta.algebra, "algebra"].join(" "));

    var op = sourceOperation.meta.operation,
        args = sourceOperation.body,
        handler = operationHandlers[op];

    if (!handler) throw new Error(["Tried to interpret unknown operation", quote(op),
                                   "as an operation in the", inputAlgebra, "algebra"].join(" "));

    return handler(args, overwrite);
  };
};

