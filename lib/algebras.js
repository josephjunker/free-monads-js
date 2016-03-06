"use strict";

// Special-cased operators

// Note: io operations can return (call back with) result values, but not new
// operations. If you want to dispatch an operation based on the results of an
// io op, you need to bind the result to a variable and then act based on that
// variable's value
function io (fn) {
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
  impure: io,
  composite: composite,
  returning: returning
};

