import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";
import { deployContract, milliSeconds2Seconds } from "../helpers";
import { expect } from "chai";

describe("GetTheGreatestBid", () => {
  it("should return the greatest bid", async () => {
    let result: BigNumber;
    const startAt: number =  milliSeconds2Seconds(Date.now() - 1000 * 5);
    const theGreatestBids: BigNumber[] = [];

    const { contract } = await deployContract(
      "AuctionL2Token",
      startAt,
      60 * 60 * 2,
      10
    );

    const [owner, acc1, acc2] = await ethers.getSigners();

    await contract.connect(owner).bid({ value: utils.parseEther("0.01") });

    result = await contract.getTheGreatestBid();
    theGreatestBids.push(result);

    await contract.connect(acc1).bid({ value: utils.parseEther("0.02") });

    result = await contract.getTheGreatestBid();
    theGreatestBids.push(result);

    await contract.connect(acc2).bid({ value: utils.parseEther("0.03") });

    result = await contract.getTheGreatestBid();
    theGreatestBids.push(result);

    expect(utils.formatEther(theGreatestBids[0])).to.eq("0.01");
    expect(utils.formatEther(theGreatestBids[1])).to.eq("0.02");
    expect(utils.formatEther(theGreatestBids[2])).to.eq("0.03");
  });
});
