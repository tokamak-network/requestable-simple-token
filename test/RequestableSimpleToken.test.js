const {expectEvent, expectRevert} = require("openzeppelin-test-helpers");
const chai = require('chai');
const {padLeft, padRight} = require("./helpers/pad");

const RequestableSimpleToken = artifacts.require("./RequestableSimpleToken.sol");

chai.use(require('chai-bn')(web3.utils.BN));

const { expect } = chai;

const toBN = web3.utils.toBN;

contract("RequestableSimpleToken", (accounts) => {
  const [
    owner,
    nextOwner,
    holder,
    other,
  ] = accounts;

  const tokenAmount = toBN(1e18);
  let requestId = 0;

  let token;

  let KEY_OWNER;
  let KEY_TOTAL_SUPPLY;

  before(async () => {
    token = await RequestableSimpleToken.deployed();

    KEY_OWNER = await token.KEY_OWNER();
    KEY_TOTAL_SUPPLY = await token.KEY_TOTAL_SUPPLY();

    await token.mint(holder, tokenAmount);
  });

  describe("request on owner", () => {
    const trieValue = padRight(owner);

    describe("#Enter", () => {
      const isExit = false;

      it("only owner in root chain can make an enter request", async () => {
        await expectRevert.unspecified(
          token.applyRequestInRootChain(isExit, requestId++, other, KEY_OWNER, trieValue)
        );

        const e = await expectEvent.inLogs(
          (await token.applyRequestInRootChain(isExit, requestId++, owner, KEY_OWNER, trieValue)).logs,
          "Requested",
        );
      });

      it("owner in child chain should be updated", async () => {
        const trieValue = padRight(nextOwner);
        const e = await expectEvent.inLogs(
          (await token.applyRequestInChildChain(isExit, requestId++, nextOwner, KEY_OWNER, trieValue)).logs,
          "Requested",
        );

        expect(await token.owner()).to.be.equal(nextOwner);
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
        const e = await expectEvent.inLogs(
          (await token.applyRequestInChildChain(isExit, requestId++, owner, KEY_OWNER, trieValue)).logs,
          "Requested",
        );
      });

      it("owner in root chain should be updated", async () => {
        const e = await expectEvent.inLogs(
          (await token.applyRequestInRootChain(isExit, requestId++, nextOwner, KEY_OWNER, trieValue)).logs,
          "Requested",
        );

        expect(await token.owner()).to.be.equal(nextOwner);
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
        const overTokenAmount = toBN(1e19);
        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, overTrieValue),
        );
      });

      it("can make an enter request", async () => {
        const e = await expectEvent.inLogs(
          (await token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, trieValue)).logs,
          "Requested",
        );

        expect(await token.balances(holder)).to.be.bignumber.equal(toBN(0));
      });

      it("balance in child chain should be updated", async () => {
        const e = await expectEvent.inLogs(
          (await token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, trieValue)).logs,
          "Requested",
        );

        expect(await token.balances(holder)).to.be.bignumber.equal(tokenAmount);
        // don't need to restore balance
      });
    });

    describe("#Exit", () => {
      const isExit = true;

      it("cannot make an exit request over his balance", async () => {
        const overTokenAmount = 1e19;

        const overTrieValue = padLeft(overTokenAmount);

        await expectRevert.unspecified(
          token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, overTrieValue),
        );
      });

      it("can make an exit request", async () => {
        const e = await expectEvent.inLogs(
          (await token.applyRequestInChildChain(isExit, requestId++, holder, trieKey, trieValue)).logs,
          "Requested",
        );

        expect(await token.balances(holder)).to.be.bignumber.equal(toBN(0));
      });

      it("balance in root chain should be updated", async () => {
        const e = await expectEvent.inLogs(
          (await token.applyRequestInRootChain(isExit, requestId++, holder, trieKey, trieValue)).logs,
          "Requested",
        );

        expect(await token.balances(holder)).to.be.bignumber.equal(tokenAmount);
      });
    });
  });
});
