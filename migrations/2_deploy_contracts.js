const RequestableSimpleToken = artifacts.require("./RequestableSimpleToken.sol");

module.exports = function(deployer) {
  deployer.deploy(RequestableSimpleToken);
};
