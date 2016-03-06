var algebras = require("./lib/algebras"),
    makeAlgebra = require("./lib/makeAlgebra"),
    makeExecutor = require("./lib/makeExecutor"),
    makeInterpreter = require("./lib/makeInterpreter");

module.exports = {
  algebras: algebras,
  makeAlgebra: makeAlgebra,
  makeExecutor: makeExecutor,
  makeInterpreter: makeInterpreter
};
