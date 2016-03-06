"use strict";

function makeAlgebraElement(algebraName, operationName, argumentsDescriptor) {

  var lastArg = argumentsDescriptor[argumentsDescriptor.length - 1],
      args = typeof lastArg === "string" ? argumentsDescriptor: argumentsDescriptor.slice(0, -1);

  return function () {
    var passedArgs = Array.prototype.slice.call(arguments);

    if (passedArgs.length !== args.length)
      throw new Error(
        "Called " + algebraName + "." + operationName + " with " + arguments.length +
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

module.exports = makeAlgebra;
