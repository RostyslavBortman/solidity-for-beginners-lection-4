import { deployContract, milliSeconds2Seconds } from "../helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";

describe("Finish", () => {
  it("should throw an error, when auction wasn't ended", async () => {
    let threw: boolean = false;

    const { contract } = await deployContract(
      "AuctionL2Token",
      milliSeconds2Seconds(Date.now() - 1000 * 5),
      60 * 60 * 2,
      10
    );

    try {
      await contract.finish();
    } catch (err) {
      const error: Error = err as Error;
      expect(error.message).to.include("The auction wasn't ended!");

      threw = true;
    }

    expect(threw).to.eq(true);
  });

  it("should throw an error, when auction has already finished", async () => {
    let threw: boolean = false;

    const { contract } = await deployContract(
      "AuctionL2Token",
      milliSeconds2Seconds(Date.now() - 1000 * 5),
      1,
      10
    );

    await contract.finish();

    try {
      await contract.finish();
    } catch (err) {
      const error: Error = err as Error;
      expect(error.message).to.include("The auction has already finished!");

      threw = true;
    }

    expect(threw).to.eq(true);
  });

  it("should successfully finish auction", async () => {
    const startAt: number = milliSeconds2Seconds(Date.now());
    const duration: number = 40;
    const [owner, acc1, acc2] = await ethers.getSigners();

    const { contract } = await deployContract(
      "AuctionL2Token",
      startAt,
      duration,
      10
    );

    await contract.connect(owner).bid({ value: utils.parseEther("0.01") });
    await contract.connect(acc1).bid({ value: utils.parseEther("0.02") });
    await contract.connect(acc2).bid({ value: utils.parseEther("0.03") });

    // await timer(1000 * 40);
    await ethers.provider.send("evm_increaseTime", [60]);
    // await ethers.provider.send("evm_mine", [startAt + 60]);

    await contract.finish();

    const balances: BigNumber[] = await Promise.all([
      contract.balanceOf(owner.address),
      contract.balanceOf(acc1.address),
      contract.balanceOf(acc2.address)
    ]);

    expect(balances[0]).to.eq(20);
    expect(balances[1]).to.eq(30);
    expect(balances[2]).to.eq(50);
  }).timeout(42000);
});
