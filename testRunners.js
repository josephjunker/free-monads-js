// Convenience methods to run the examples with mock data

var stubs = require('./testStubs');

module.exports.runFileSave = function (getSaveFile) {
  var path = {
    parentDir: "some/path",
    name: "someFile"
  };

  path.show = function () {
    return path.parentDir + "/" + path.name;
  };

  var saveFile = getSaveFile({
    logger: stubs.makeLogger(),
    http: stubs.makeHttp()
  });

  saveFile(path, "file contents", function (err) {
    if (err) console.log("saveFile returned an error: " + err);
    console.log("test complete");
  });
};

module.exports.runFileSaveWithError = function (getSaveFile) {
  var path = {
    parentDir: "some/path",
    name: "someFile"
  };

  path.show = function () {
    return path.parentDir + "/" + path.name;
  };

  var httpStub = stubs.makeHttp();

  var saveFile = getSaveFile({
    logger: stubs.makeLogger(),
    http: {
      post: httpStub.post.setCallbackArgs(new Error("POST failed"))
    }
  });

  saveFile(path, "file contents", function (err) {
    if (err) console.log("saveFile returned an error: " + err);
    console.log("test complete");
  });
};
