import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("Auction", function () {

  const oneHour = 60 * 60;
  const oneMin = 60;
  const now = Math.floor(Date.now() / 1000);

    it("should throw the error if auction has not started", async () => {
      let startAt = now + oneHour;
      let contract = await deploy(startAt, oneHour, 20);
      
      await expect(
        contract.placeBid()
      ).to.be.revertedWith("The auction has not started yet");
    });

    it("should throw the error if auction was finished", async () => {
      let startAt = now - oneHour;
      let contract = await deploy(startAt, oneMin, 20);
      
      await expect(
        contract.placeBid()
      ).to.be.revertedWith("The auction has already ended");
    });

    it("should throw the error if bid is too small", async () => {
      let contract = await deploy(now, oneHour, 20);
      
      await expect(
        contract.placeBid({ value: utils.parseEther("0.001")})
      ).to.be.revertedWith("bit should be > 0.01");
    });

    it("should throw the error if bid is less than previous bid", async () => {
      let contract = await deploy(now, oneHour, 20);
      
      contract.placeBid({ value: utils.parseEther("1") });

      await expect(
        contract.placeBid({ value: utils.parseEther("0.02")})
      ).to.be.revertedWith("bit should be > highestBid");
    });

    it("should throw the error if user is trying to place more than 3 bids", async () => {
      let contract = await deploy(now, oneHour, 20);
      
      contract.placeBid({ value: utils.parseEther("1") });
      contract.placeBid({ value: utils.parseEther("2") });
      contract.placeBid({ value: utils.parseEther("3") });
      
      await expect(
        contract.placeBid({ value: utils.parseEther("4") })
      ).to.be.revertedWith("The user can make only 3 bids");
    });

    it("should successfully place the bid", async () => {
      const contract = await deploy(now, oneHour, 20);
      const bidValue = "1.0";

      contract.placeBid({ value: utils.parseEther(bidValue) });
      
      const accountBid = await contract.getBid();
      const placedBid = accountBid.bids[0];
      const placedBidValue = utils.formatEther(placedBid);
      expect(placedBidValue).to.equal(bidValue);
    });

    it("should refund the bid with the lowest value when the auction reaches maximum of bids", async () => {
      const contract = await deploy(now, oneHour, 2);
      
      const amount = "1.0";
      const [owner, addr1, addr2] = await ethers.getSigners();

      contract.connect(owner).placeBid({ value: utils.parseEther(amount) });

      const accountOwnerBid = await contract.connect(owner).getBid();
      const placedOwnerBid = accountOwnerBid.bids[0];
      const placedOwnerBidValue = utils.formatEther(placedOwnerBid);

      await contract.connect(addr1).placeBid({ value: utils.parseEther("2.0") });
      await contract.connect(addr2).placeBid({ value: utils.parseEther("3.0") });
      
      const accountOwnerBidAtEnd = await contract.connect(owner).getBid();
      const placedOwnerBidsAtEnd = accountOwnerBidAtEnd.bids;

      expect(placedOwnerBidValue).to.equal(amount);
      expect(placedOwnerBidsAtEnd.length).to.equal(0);
    });

    async function deploy(startAt: number, duration: number, maxCountOfBids: number)  {
      const Auction = await ethers.getContractFactory("Auction");
      const auction = await Auction.deploy(startAt, duration, maxCountOfBids);
      await auction.deployed();

      return auction;
    }
  });