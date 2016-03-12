"use strict";

var makeInterpreter = require("../lib/makeInterpreter");

var expect = require("chai").expect;

describe("makeInterpreter", function () {
  it("should return a function", function () {
    var interpreter = makeInterpreter("algebraName", {
      someOp: function (args) { }
    });

    expect(typeof interpreter).to.equal("function");
  });

  describe("creates a function which", function () {
    it("dispatches its arguments to the matching interpretation function", function () {
      var calls = {
        first: [],
        second: []
      };

      // Don't do side effects inside of your interpreters;
      // this is only for testing
      var interpreter = makeInterpreter("algebraName", {
        first: function (args) {
          calls.first.push(args);
        },
        second: function (args) {
          calls.second.push(args);
        }
      });

      var op1 = {
        meta: {
          algebra: "algebraName",
          operation: "first"
        },
        body: {
          onlyArg: [1, 2, 3]
        }
      };
      var op2 = {
        meta: {
          algebra: "algebraName",
          operation: "second"
        },
        body: {
          arg1: "foo",
          arg2: null,
          arg3: 42
        }
      };

      interpreter(op1);

      expect(calls).to.deep.equal({
        first: [{ onlyArg: [1, 2, 3] }],
        second: []
      });

      interpreter(op2);

      expect(calls).to.deep.equal({
        first: [{ onlyArg: [1, 2, 3] }],
        second: [{
          arg1: "foo",
          arg2: null,
          arg3: 42
        }]
      });
    });

    it("throws an error if the operation's algebra doesn't match the interpreter's", function () {
      var interpreter = makeInterpreter("algebraName", { first: function () { } }),
          op = {
            meta: {
              algebra: "differentAlgebraName",
              operation: "first"
            },
            body: { }
          };

      expect(function () { interpreter(op); }).to.throw(/but it belongs to the differentAlgebraName algebra/);
    });

    it("throws an error if the operation doesn't exist in the interpreter", function () {
      var interpreter = makeInterpreter("algebraName", { first: function () { } }),
          op = {
            meta: {
              algebra: "algebraName",
              operation: "second"
            },
            body: { }
          };

      expect(function () { interpreter(op); }).to.throw(/unknown operation \|second\|/);
    });
  });
});

