var util = require("util");

function show(x) {
  console.log(util.inspect(x, { depth: null }));
}

function makeTracingStub (traceName) {
  var callbackArgs = [];

  function trace () {
    console.log(traceName + " was called with arguments:");

    var args = Array.prototype.slice.call(arguments),
        callback = args[args.length - 1],
        otherArgs = args.slice(0, args.length - 1);

    otherArgs.forEach(function (arg) {
      show(arg);
    });

    console.log("\n");

    callback.apply(null, callbackArgs);
  };

  trace.setCallbackArgs = function () {
    callbackArgs = Array.prototype.slice.call(arguments);
    return trace;
  };

  return trace;
}

module.exports.makeLoggerMock = function () {
  return {
    log: makeTracingStub("logger.log")
  };
};

module.exports.makeHttpMock = function () {
  return {
    GET: makeTracingStub("http.GET"),
    PUT: makeTracingStub("http.PUT"),
    POST: makeTracingStub("http.POST"),
    DELETE: makeTracingStub("http.DELETE")
  };
};
