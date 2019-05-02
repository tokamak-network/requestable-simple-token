const RequestableSimpleTokenNoOwner = artifacts.require("./RequestableSimpleTokenWithNoOwnership.sol");

module.exports = function(deployer) {
  deployer.deploy(RequestableSimpleTokenNoOwner);
};
