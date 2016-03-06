var route = require("./middleware");
route({
  type: "changeEmail",
  args: {
    userId: 1,
    token: "foo",
    emailAddress: "address@example.com"
  }
});
