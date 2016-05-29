"use strict";

var makeExecutor = require("../lib/makeExecutor"),
    makeAlgebra = require("../lib/makeAlgebra"),
    makeInterpreter = require("../lib/makeInterpreter"),
    algebras = require("../lib/algebras"),
    returnValue = algebras.returning,
    composite = algebras.composite;

var chai = require("chai"),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    expect = chai.expect;
chai.use(sinonChai);

describe("makeExecutor", function () {

  it("should call the interpreter for the operation it's given", function (done) {
    var sampleAlgebra = makeAlgebra("testAlgebra", {
      someOperation: ["foo", "bar"]
    });

    var opInterpreter = sinon.stub();
    var sampleInterpreter = makeInterpreter("testAlgebra", {
      someOperation: opInterpreter
    });

    var execute = makeExecutor({ testAlgebra: sampleInterpreter });

    execute(sampleAlgebra.someOperation(1, 2), function () {
      expect(opInterpreter).to.be.calledOnce;
      expect(opInterpreter).to.be.calledWithMatch({
        foo: 1,
        bar: 2
      });

      done();
    });
  });

  it("should call multiple interpreters in sequence when given an array of operations", function (done) {
    var sampleAlgebra = makeAlgebra("testAlgebra", {
      firstOperation: ["foo", "bar"],
      secondOperation: [],
      thirdOperation: ["baz"]
    });

    var interpreters = {
      first: sinon.stub(),
      second: sinon.stub(),
      third: sinon.stub()
    };

    var sampleInterpreter = makeInterpreter("testAlgebra", {
      firstOperation: interpreters.first,
      secondOperation: interpreters.second,
      thirdOperation: interpreters.third
    });

    var execute = makeExecutor({ testAlgebra: sampleInterpreter });

    var program = [
      sampleAlgebra.firstOperation(1, 2),
      sampleAlgebra.secondOperation(),
      sampleAlgebra.thirdOperation("qux")
    ];

    execute(program, function () {
      expect(interpreters.first).to.be.calledOnce;
      expect(interpreters.first).to.be.calledWithMatch({
        foo: 1,
        bar: 2
      });

      expect(interpreters.second).to.be.calledOnce;
      expect(interpreters.second).to.be.calledAfter(interpreters.first);
      expect(interpreters.second).to.be.calledWithMatch({});

      expect(interpreters.third).to.be.calledOnce;
      expect(interpreters.third).to.be.calledAfter(interpreters.second);
      expect(interpreters.third).to.be.calledWithMatch({ baz: "qux" });

      done();
    });
  });

  it("should let operations return values, and return an environment after execution", function (done) {
    var sampleAlgebra = makeAlgebra("testAlgebra", {
      firstOperation: ["foo", "bar", { returns: "number" }],
      secondOperation: [{ returns: "string" }],
      thirdOperation: ["baz", { returns: "object" }]
    });

    var interpreters = {
      first: sinon.stub().returns(returnValue(1)),
      second: sinon.stub().returns(returnValue("foo")),
      third: sinon.stub().returns(returnValue({ bar: "baz" }))
    };

    var sampleInterpreter = makeInterpreter("testAlgebra", {
      firstOperation: interpreters.first,
      secondOperation: interpreters.second,
      thirdOperation: interpreters.third
    });

    var execute = makeExecutor({ testAlgebra: sampleInterpreter });

    var program = [
      { firstResult: sampleAlgebra.firstOperation(1, 2) },
      { secondResult: sampleAlgebra.secondOperation() },
      { thirdResult: sampleAlgebra.thirdOperation("qux") }
    ];

    execute(program, function (environment) {
      expect(interpreters.first).to.be.calledOnce;
      expect(interpreters.first).to.be.calledWithMatch({
        foo: 1,
        bar: 2
      });

      expect(interpreters.second).to.be.calledOnce;
      expect(interpreters.second).to.be.calledAfter(interpreters.first);
      expect(interpreters.second).to.be.calledWithMatch({});

      expect(interpreters.third).to.be.calledOnce;
      expect(interpreters.third).to.be.calledAfter(interpreters.second);
      expect(interpreters.third).to.be.calledWithMatch({ baz: "qux" });

      expect(environment).to.deep.equal({
        firstResult: 1,
        secondResult: "foo",
        thirdResult: { bar: "baz" }
      });

      done();
    });
  });

  it("should handle interpreters which return other operations", function (done) {
    var algA = makeAlgebra("algA", {
      firstOp: ["foo", "bar"],
      secondOp: [],
      thirdOp: ["baz"]
    });

    var algB = makeAlgebra("algB", {
      oneB: ["yay"],
      twoB: ["woo", "wahoo"],
      threeB: ["hooray"]
    });

    var algC = makeAlgebra("algC", {
      someOp: ["a"],
      anotherOp: ["b"],
      yetAnother: ["c"],
      fourthOp: ["d"]
    });

    var interpreterA = {
      firstOp: function (args) {
          console.log('called firstOp');
        return composite([
          algB.oneB(args.foo),
          algB.twoB(args.bar, 42)
        ]);
      },
      secondOp: sinon.stub().returns(),
      thirdOp: function (args) {
        return algB.threeB(args.baz);
      }
    };

    sinon.spy(interpreterA, "firstOp");
    sinon.spy(interpreterA, "thirdOp");

    var interpreterB = {
      oneB: function (args) {
        return composite([
          algC.someOp(args.yay),
          algC.anotherOp(args.yay)
        ]);
      },
      twoB: sinon.stub().returns(),
      threeB: function (args) {
        return algC.yetAnother("asdf");
      }
    };

    sinon.spy(interpreterB, "oneB");
    sinon.spy(interpreterB, "threeB");

    var interpreterC = {
      someOp: sinon.stub().returns(),
      anotherOp: sinon.stub().returns(),
      yetAnother: sinon.stub().returns(),
      fourthOp: sinon.stub().returns()
    };

    var program = [
      algA.firstOp(1, 2),
      algA.secondOp(),
      algC.fourthOp(3),
      algA.thirdOp(4)
    ];

    var execute = makeExecutor({
      algA: makeInterpreter("algA", interpreterA),
      algB: makeInterpreter("algB", interpreterB),
      algC: makeInterpreter("algC", interpreterC)
    });

    execute(program, function () {

      /* Results of first instruction */
      expect(interpreterA.firstOp).to.be.calledOnce;
      expect(interpreterA.firstOp).to.be.calledWithMatch({
        foo: 1,
        bar: 2
      });

      expect(interpreterB.oneB).to.be.calledOnce;
      expect(interpreterB.oneB).to.be.calledAfter(interpreterA.firstOp);
      expect(interpreterB.oneB).to.be.calledWithMatch({ yay: 1 });

      expect(interpreterC.someOp).to.be.calledOnce;
      expect(interpreterC.someOp).to.be.calledAfter(interpreterB.oneB);
      expect(interpreterC.someOp).to.be.calledWithMatch({ a: 1 });

      expect(interpreterC.anotherOp).to.be.calledOnce;
      expect(interpreterC.anotherOp).to.be.calledAfter(interpreterC.someOp);
      expect(interpreterC.anotherOp).to.be.calledWithMatch({ b: 1 });

      expect(interpreterB.twoB).to.be.calledOnce;
      expect(interpreterB.twoB).to.be.calledAfter(interpreterC.anotherOp);
      expect(interpreterB.twoB).to.be.calledWithMatch({ woo: 2, wahoo: 42 });

      /* Results of second instruction */

      expect(interpreterA.secondOp).to.be.calledOnce;
      expect(interpreterA.secondOp).to.be.calledAfter(interpreterB.twoB);
      expect(interpreterA.secondOp).to.be.calledWithMatch({});

      /* Results of third instruction */

      expect(interpreterC.fourthOp).to.be.calledOnce;
      expect(interpreterC.fourthOp).to.be.calledAfter(interpreterA.secondOp);
      expect(interpreterC.fourthOp).to.be.calledWithMatch({ d: 3 });

      /* Results of fourth instruction */

      expect(interpreterA.thirdOp).to.be.calledOnce;
      expect(interpreterA.thirdOp).to.be.calledAfter(interpreterC.fourthOp);
      expect(interpreterA.thirdOp).to.be.calledWithMatch({ baz: 4 });

      expect(interpreterB.threeB).to.be.calledOnce;
      expect(interpreterB.threeB).to.be.calledAfter(interpreterA.thirdOp);
      expect(interpreterB.threeB).to.be.calledWithMatch({ hooray: 4 });

      expect(interpreterC.yetAnother).to.be.calledOnce;
      expect(interpreterC.yetAnother).to.be.calledAfter(interpreterB.threeB);
      expect(interpreterC.yetAnother).to.be.calledWithMatch({ c: "asdf" });

      done();
    });
  });

});

