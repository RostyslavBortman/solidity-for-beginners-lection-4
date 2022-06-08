import { deployContract, milliSeconds2Seconds } from "../helpers";
import { expect } from "chai";
import { BigNumber, Contract, utils } from "ethers";
import { ethers } from "hardhat";

describe("Bid", () => {
  it("should throw an error if auction wasn\'t started", async () => {
    let threw: boolean = false;

    const { contract } = await deployContract(
      "AuctionL2Token",
      milliSeconds2Seconds(Date.now() + 1000 * 60 * 60 * 10),
      1,
      10
    );

    try {
      await contract.bid();
    } catch (err) {
      const error: Error = err as Error;
      expect(error.message).to.include("The auction wasn't started!");
      threw = true;
    }

    expect(threw).to.eq(true);
  });

  it("should throw an error if auction was ended", async () => {
    let threw: boolean = false;

    const { contract } = await deployContract(
      "AuctionL2Token",
      milliSeconds2Seconds(Date.now() - 1000 * 60 * 60 * 5),
      1,
      10
    );

    try {
      await contract.bid();
    } catch (err) {
      const error: Error = err as Error;
      expect(error.message).to.include("The auction was ended!");
      threw = true;
    }

    expect(threw).to.eq(true);
  });

  describe("Independent of dates", () => {
    let contract: Contract;

    beforeEach(async () => {
      ({ contract } = await deployContract(
        "AuctionL2Token",
        milliSeconds2Seconds(Date.now() + 1000),
        60 * 60 * 2,
        2
      ));
    });

    it("should throw an error when bid is so small", async () => {
      let threw: boolean = false;

      try {
        await contract.bid({
          value: utils.parseEther("0.0001")
        });
      } catch (err) {
        const error: Error = err as Error;
        expect(error.message).to.include("Min bid is 0.01 ether!");
        threw = true;
      }

      expect(threw).to.eq(true);
    });

    it("should successfully add bid", async () => {
      const myEther = "0.01";

      await contract.bid({ value: utils.parseEther(myEther) });

      const result: BigNumber = await contract.getMyBid();

      expect(utils.formatEther(result)).to.eq(myEther);
    });

    it("should throw an error if you have already had the active bid", async () => {
      let threw: boolean = false;

      await contract.bid({ value: utils.parseEther("0.01") });

      try {
        await contract.bid({ value: utils.parseEther("0.02") });
      } catch (err) {
        const error: Error = err as Error;
        expect(error.message).to.include("You have active bid!");
        threw = true;
      }

      expect(threw).to.eq(true);
    });

    it("should throw an error if a bid is lower than previous", async () => {
      let threw: boolean = false;

      const [, acc1] = await ethers.getSigners();

      await contract.bid({ value: utils.parseEther("0.01") });

      try {
        await contract.connect(acc1).bid({
          value: utils.parseEther("0.01")
        });
      } catch (err) {
        const error: Error = err as Error;
        expect(error.message).to.include("Each bid must be greater then previous!");
        threw = true;
      }

      expect(threw).to.eq(true);
    });

    it("should 'remove' the user with the lowest bid from the auction after reaching the maximum number bids and one more bid", async () => {
      const ownerBidEther = "0.01";
      const [owner, acc1, acc2] = await ethers.getSigners();

      const balanceAtStart = await owner.getBalance();

      await contract.bid({ value: utils.parseEther(ownerBidEther) });

      const [balanceAfterBid, ownerBid] = await Promise.all([
        owner.getBalance(),
        contract.getMyBid()
      ]);

      await contract.connect(acc1).bid({ value: utils.parseEther("0.02") });
      await contract.connect(acc2).bid({ value: utils.parseEther("0.03") });

      const [balanceAtEnd, ownerBidAtEnd] = await Promise.all([
        owner.getBalance(),
        contract.getMyBid()
      ]);

      expect(balanceAfterBid).to.lt(balanceAtStart);
      expect(utils.formatEther(ownerBid)).to.eq(ownerBidEther);
      expect(ownerBidAtEnd).to.eq(0);
      expect(balanceAtEnd).to.gt(balanceAfterBid);
      expect(balanceAtEnd).to.lte(balanceAtStart);
    });

    it("should throw error when user has already used all 3 attempts for bids", async () => {
      let threw: boolean = false;

      const [owner, acc1, acc2] = await ethers.getSigners();

      await contract.connect(owner).bid({ value: utils.parseEther("0.01") });
      await contract.connect(acc1).bid({ value: utils.parseEther("0.02") });
      await contract.connect(acc2).bid({ value: utils.parseEther("0.03") });

      await contract.connect(owner).bid({ value: utils.parseEther("0.04") });
      await contract.connect(acc1).bid({ value: utils.parseEther("0.05") });
      await contract.connect(acc2).bid({ value: utils.parseEther("0.06") });

      await contract.connect(owner).bid({ value: utils.parseEther("0.07") });
      await contract.connect(acc1).bid({ value: utils.parseEther("0.08") });
      await contract.connect(acc2).bid({ value: utils.parseEther("0.09") });

      try {
        await contract.connect(owner).bid({ value: utils.parseEther("1") });
      } catch (err) {
        const error: Error = err as Error;
        expect(error.message).to.include("The user can do 3 bids maximum in total!");

        threw = true;
      }

      expect(threw).to.eq(true);
    });
  });
});
