var route = require("./middleware");
// TODO: next thing to do is to add support for return types to makeAlgebra
route({
  type: "changeEmail",
  args: {
    userId: 1,
    token: "foo",
    emailAddress: "address@example.com"
  }
});
