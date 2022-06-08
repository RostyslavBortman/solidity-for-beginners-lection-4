import { deployContract, milliSeconds2Seconds } from "../helpers";
import { expect } from "chai";

describe("Get max count of bids", () => {
  it("should return properly max count of bids", async () => {
    const maxCountOfBids = 10;

    const { contract } = await deployContract(
      "AuctionL2Token",
      milliSeconds2Seconds(Date.now()),
      1,
      maxCountOfBids
    );

    const result: number = await contract.getMaxCountOfBids();

    expect(result).to.eq(maxCountOfBids);
  });
});
