"use strict";

var inspect = require('util').inspect;

module.exports = function makeInterpreter (inputAlgebra, operationHandlers) {
  return function interpreter (sourceOperation, overwrite) {

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

    return handler(args, overwrite);
  };
};

