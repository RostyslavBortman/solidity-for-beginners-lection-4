import {ethers, network} from "hardhat";
import {expect} from "chai";

import chai from "chai";
import { solidity } from "ethereum-waffle";
import {it} from "mocha";
import {Contract, ContractFactory} from "ethers";

chai.use(solidity);

describe("Bidder", function () {
  let Bidder: ContractFactory;
  let bidder: Contract;


  beforeEach(async function () {
    let currentTime = new Date().getTime();

    Bidder = await ethers.getContractFactory("Bidder");
    bidder = await Bidder.deploy(0, currentTime + 1000000000, 1000);
    await bidder.deployed();
  });
  it("Min bid", async function () {
    await expect(bidder.bid({value: ethers.utils.parseEther("0.0001")})).to.be.reverted;
  });
  it("Lower bid", async function () {
    await bidder.bid({value: ethers.utils.parseEther("1")});
    await expect(bidder.bid({value: ethers.utils.parseEther("0.9999")})).to.be.reverted;
  });
  it("Limit of bids", async function () {
    await bidder.bid({value: ethers.utils.parseEther("1")});
    await bidder.bid({value: ethers.utils.parseEther("2")});
    await bidder.bid({value: ethers.utils.parseEther("3")});

    await expect(bidder.bid({value: ethers.utils.parseEther("4")})).to.be.reverted;
  });
  it("Before time", async function () {
    let currentTime = new Date().getTime();
    bidder = await Bidder.deploy(currentTime + 100000000000, 1000000000, 1000);
    await bidder.deployed();

    await expect(bidder.bid({value: ethers.utils.parseEther("1")})).to.be.reverted;
  });
  it("After time", async function () {
    bidder = await Bidder.deploy(0, 1000000000, 1000);
    await bidder.deployed();

    await expect(bidder.bid({value: ethers.utils.parseEther("1")})).to.be.reverted;
  });
  it("Successful bids", async function () {
    // Generate 20 random addresses
    let [...addrs] = await ethers.getSigners();

    // Make 40 bids. Two bids from each address
    for (let i = 0; i < 40; i++) {
        let addr = addrs[i % 20];
        await bidder.connect(addr).bid({value: ethers.utils.parseEther((i+1).toString())});
    }

    // generate array from 20 to 40
    let expectedBids = Array.from(Array(20).keys()).map(x => ethers.utils.parseEther((x + 21).toString()));

    let actualBids = await bidder.getBids();

    expect(actualBids).to.deep.equal(expectedBids);
  });
  it("Get winners before time", async function () {
    await expect(bidder.setWinners()).to.be.reverted;
  });
  it("Get winners after time", async function () {
    let currentTime = new Date().getTime();
    let totalSupply = 1000;
    const provider = ethers.provider;

    await network.provider.send("evm_setNextBlockTimestamp", [currentTime]);
    bidder = await Bidder.deploy(currentTime, 10000000000, totalSupply);
    await bidder.deployed();

    // Generate 20 random addresses
    let [...addrs] = await ethers.getSigners();

    // Make 40 bids. Two bids from each address
    for (let i = 0; i < 40; i++) {
      let addr = addrs[i % 20];
      let t = await bidder.connect(addr).bid({value: ethers.utils.parseEther((i+1).toString())});
    }



    await network.provider.send("evm_setNextBlockTimestamp", [currentTime + 100000000000]);

    await bidder.setWinners();

    let firstWinner = await bidder.winners(0);
    let secondWinner = await bidder.winners(1);
    let thirdWinner = await bidder.winners(2);

    const Token = await ethers.getContractFactory("KhominToken");
    let token = await Token.attach(bidder.token());

    expect(firstWinner).to.equal(addrs[19].address);
    expect(secondWinner).to.equal(addrs[18].address);
    expect(thirdWinner).to.equal(addrs[17].address);

    expect(await token.balanceOf(firstWinner)).to.equal(totalSupply * 50 / 100);
    expect(await token.balanceOf(secondWinner)).to.equal(totalSupply * 30 / 100);
    expect(await token.balanceOf(thirdWinner)).to.equal(totalSupply * 20 / 100);

    for (let i = 0; i < 17; i++) {
        expect(await token.balanceOf(addrs[i].address)).to.equal(0);
    }
  });
});
