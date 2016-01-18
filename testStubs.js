var util = require("util");

function show(x) {
  console.log(util.inspect(x, { depth: null }));
}

function makeTracingStub (traceName) {
  var callbackArgs = [];

  function trace () {

    var args = Array.prototype.slice.call(arguments),
        callback = args[args.length - 1],
        otherArgs = args.slice(0, args.length - 1);

    if (otherArgs.length) {
      console.log(traceName + " was called with arguments:");

      otherArgs.forEach(function (arg) {
        show(arg);
      });

    } else {
      console.log(traceName + " was called with no arguments.");
    }

    console.log("\n");
    callback.apply(null, callbackArgs);
  };

  trace.setCallbackArgs = function () {
    callbackArgs = Array.prototype.slice.call(arguments);
    return trace;
  };

  return trace;
}

module.exports.makeLogger = function () {
  return {
    log: makeTracingStub("logger.log")
  };
};

module.exports.makeHttp = function () {
  return {
    get: makeTracingStub("http.get"),
    put: makeTracingStub("http.put"),
    post: makeTracingStub("http.post"),
    delete: makeTracingStub("http.delete")
  };
};

