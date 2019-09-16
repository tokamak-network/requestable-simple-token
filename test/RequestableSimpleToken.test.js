const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const {expectThrow} = require("openzeppelin-solidity/test/helpers/expectThrow");
const {padLeft, padRight} = require("./helpers/pad");

const RequestableSimpleToken = artifacts.require("./RequestableSimpleToken.sol");

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();


contract("RequestableSimpleToken", (accounts) => {
  const [
    owner,
    nextOwner,
    holder,
    other,
  ] = accounts;

  const tokenAmount = 1e18;
  let requestId = 0;

  let token;

  before(async () => {
    token = await RequestableSimpleToken.deployed();

    await token.mint(holder, tokenAmount);
  });

  describe("request on owner", () => {
    const trieKey = padLeft("0x00");
    const trieValue = padRight(owner);

    describe("#Enter", () => {
      const isExit = false;

      it("only owner in root chain can make an enter request", async () => {
        await expectThrow(
          token.applyRequestInRootChain(isExit, requestId++, other, trieKey, trieValue)
        );

        const e = await expectEvent.inTransaction(
          token.applyRequestInRootChain(isExit, requestId++, owner, trieKey, trieValue),
          "Requested",
        );
      });

      it("owner in child chain should be updated", async () => {
        const trieValue = padRight(nextOwner);
        const e = await expectEvent.inTransaction(
          token.applyRequestInChildChain(isExit, requestId++, nextOwner, trieKey, trieValue),
          "Requested",
        );

        (await token.owner()).should.be.equal(nextOwner);
      });

      after(async () => {
        // restore owner
        await token.transferOwnership(owner, { from: nextOwner });
      });
    });

    describe("#Exit", () => {
      const isExit = true;

      it("only owner in child chain can make a exit request", async () => {
        const trieValue = padRight(nextOwner);
        const e = await expectEvent.inTransaction(
          token.applyRequestInChildChain(isExit, requestId++, owner, trieKey, trieValue),
          "Requested",
        );
      });

      it("owner in root chain should be updated", async () => {
        const e = await expectEvent.inTransaction(
          token.applyRequestInRootChain(isExit, requestId++, nextOwner, trieKey, trieValue),
          "Requested",
        );

        (await token.owner()).should.be.equal(nextOwner);
      });
    });
  });

  describe("request on balances", () => {
    let trieKey;
    const trieValue = padLeft(tokenAmount);

    before(async () => {
      trieKey = await token.getBalanceTrieKey(holder);
    });

    describe("#Enter", () => {
      const isExit = false;

      it("cannot make an enter request over his balance", async () => {
        const overTokenAmount = 1e19;

        const overTrieValue = padLeft(overTokenAmount);

        await expectThrow(
          token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, overTrieValue),
        );
      });

      it("can make an enter request", async () => {
        const e = await expectEvent.inTransaction(
          token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, trieValue),
          "Requested",
        );

        (await token.balances(holder)).should.be.bignumber.equal(0);
      });

      it("balance in child chain should be updated", async () => {
        const e = await expectEvent.inTransaction(
          token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, trieValue),
          "Requested",
        );

        (await token.balances(holder)).should.be.bignumber.equal(tokenAmount);
        // don't need to restore balance
      });
    });

    describe("#Exit", () => {
      const isExit = true;

      it("cannot make an exit request over his balance", async () => {
        const overTokenAmount = 1e19;

        const overTrieValue = padLeft(overTokenAmount);

        await expectThrow(
          token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, overTrieValue),
        );
      });

      it("can make an exit request", async () => {
        const e = await expectEvent.inTransaction(
          token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, trieValue),
          "Requested",
        );

        (await token.balances(holder)).should.be.bignumber.equal(0);
      });

      it("balance in root chain should be updated", async () => {
        const e = await expectEvent.inTransaction(
          token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, trieValue),
          "Requested",
        );

        (await token.balances(holder)).should.be.bignumber.equal(tokenAmount);
      });
    });
  });
});
