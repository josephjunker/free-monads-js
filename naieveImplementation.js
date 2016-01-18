// This file corresponds to the beginning IO monad example in De Goes' post

var testRunners = require('./testRunners');

// We use this to inject the mocks for our tests
function getSaveFile (mocks) {
  var log = mocks.logger.log,
      post = mocks.http.post;

  // The actual function from the article
  function saveFile (path, file, callback) {
    log("Saving file " + path.name + " to " + path.parentDir, function () {
      post("cloudfiles.fooservice.com" + path.show(), file, function (postErr) {
        if (!postErr) {
          log("Successfully saved file " + path.show(), callback);
        } else {
          log("Failed to save file " + path.show(), function () {
            callback(postErr);
          });
        }
      });
    });
  }

  return saveFile;
}

console.log("Run expecting success:")
testRunners.runFileSave(getSaveFile);
console.log("\n\nRun expecting error:")
testRunners.runFileSaveWithError(getSaveFile);
