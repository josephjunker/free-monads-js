"use strict";

var interpreters = require("./domainInterpreters"),
    changeEmail = require("./changeEmail"),
    makeExecutor = require("../lib/makeExecutor"),
    api = require("./algebras").apiResponses;

var execute = makeExecutor(interpreters);

// yeah, I'm not gonna actually implement routing for an express app here.
// Imagine that I did, and request.type is method & path routing, and request.args
// is pulling stuff out of the request body and params
module.exports = function (request, response) {
  var program;

  if (request.type === "changeEmail") {
    var userId = request.args.userId,
        token = request.args.token,
        emailAddress = request.args.emailAddress;

    program = changeEmail(userId, token, emailAddress);
  }

  execute([{ result: program }, function (args) { api.respond(args.result, response); }]);
};
