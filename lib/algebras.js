"use strict";

// Special-cased operators

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

function composite(ops) {
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

function returning(value) {
  return {
    meta: {
      type: "special",
      algebra: "returning",
      operation: "returning"
    },
    body: {
      value: value
    }
  };
}

module.exports = {
  io: io,
  composite: composite,
  returning: returning
};

