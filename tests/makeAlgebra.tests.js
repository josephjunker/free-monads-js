"use strict";

var makeAlgebra = require("../lib/makeAlgebra");

var expect = require("chai").expect;

describe("makeAlgebra", function () {
  it("should create an object with functions for each given operation", function () {

    var algebra = makeAlgebra("example", {
      plainOperation: ["arg1", "arg2", "arg3"],
      arglessOperation: [],
      arglessGet: [{ returns: "number" }],
      operationReturningValue: ["firstArg", { returns: "string" }]
    });

    expect(Object.keys(algebra).length).to.equal(4);
    expect(typeof algebra.plainOperation).to.equal("function");
    expect(typeof algebra.arglessOperation).to.equal("function");
    expect(typeof algebra.arglessGet).to.equal("function");
    expect(typeof algebra.operationReturningValue).to.equal("function");
  });

  it("should create functions that produce the correct operation descriptor", function () {

    var algebra = makeAlgebra("example", {
      plainOperation: ["arg1", "arg2", "arg3"],
      arglessOperation: [],
      arglessGet: [{ returns: "number" }],
      operationReturningValue: ["firstArg", { returns: "string" }]
    });

    expect(algebra.plainOperation(1, { foo: "bar" }, "a")).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "plainOperation"
      },
      body: {
        arg1: 1,
        arg2: { foo: "bar" },
        arg3: "a"
      }
    });

    expect(algebra.arglessOperation()).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "arglessOperation"
      },
      body: {}
    });

    expect(algebra.arglessGet()).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "arglessGet"
      },
      body: {}
    });

    expect(algebra.operationReturningValue({ foo: "bar", baz: 42 })).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operationReturningValue"
      },
      body: {
        firstArg: { foo: "bar", baz: 42 }
      }
    });
  });

  it("should throw an error if the wrong number of arguments is passed to a function", function () {

    var algebra = makeAlgebra("example", {
      plainOperation: ["arg1", "arg2", "arg3"],
      arglessOperation: [],
      arglessGet: [{ returns: "number" }],
      operationReturningValue: ["firstArg", { returns: "string" }]
    });

    expect(function () { algebra.plainOperation(1, 2); }).to.throw(/3 arguments are expected/);
    expect(function () { algebra.plainOperation(1, 2, 3, 4); }).to.throw(/3 arguments are expected/);
    expect(function () { algebra.plainOperation(null, null, null, null); }).to.throw(/3 arguments are expected/);
    expect(function () { algebra.plainOperation(undefined, undefined, undefined, undefined); })
      .to.throw(/3 arguments are expected/);

    expect(function () { algebra.arglessOperation("foo"); }).to.throw(/0 arguments are expected/);
    expect(function () { algebra.arglessOperation(null); }).to.throw(/0 arguments are expected/);
    expect(function () { algebra.arglessOperation(undefined); }).to.throw(/0 arguments are expected/);

    expect(function () { algebra.arglessGet("foo"); }).to.throw(/0 arguments are expected/);
    expect(function () { algebra.arglessGet(null); }).to.throw(/0 arguments are expected/);
    expect(function () { algebra.arglessGet(undefined); }).to.throw(/0 arguments are expected/);

    expect(function () { algebra.operationReturningValue(); }).to.throw(/1 arguments are expected/);
    expect(function () { algebra.operationReturningValue(1, 2); }).to.throw(/1 arguments are expected/);
    expect(function () { algebra.operationReturningValue(null, null); }).to.throw(/1 arguments are expected/);
    expect(function () { algebra.operationReturningValue(undefined, undefined); })
      .to.throw(/1 arguments are expected/);
  });

  it("should handle nulls and undefineds as arguments", function () {

    var algebra = makeAlgebra("example", {
      operation: ["arg1", "arg2", "arg3", { returns: "number" }]
    });

    expect(algebra.operation(null, null, null)).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: null,
        arg2: null,
        arg3: null
      }
    });

    expect(algebra.operation(undefined, undefined, undefined)).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: undefined,
        arg2: undefined,
        arg3: undefined
      }
    });

    expect(algebra.operation(undefined, null, undefined)).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: undefined,
        arg2: null,
        arg3: undefined
      }
    });

    expect(algebra.operation("foo", null, "bar")).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: "foo",
        arg2: null,
        arg3: "bar"
      }
    });

    expect(algebra.operation(undefined, "foo", "bar")).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: undefined,
        arg2: "foo",
        arg3: "bar"
      }
    });

    expect(algebra.operation({ foo: "bar" }, { baz: "qux" }, null)).to.deep.equal({
      meta: {
        algebra: "example",
        operation: "operation"
      },
      body: {
        arg1: { foo: "bar" },
        arg2: { baz: "qux" },
        arg3: null
      }
    });
  });
});

