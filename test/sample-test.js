const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

describe("Auction contract", function () {
  let simpleAuction;
  let hardhatAuction;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  let provider;

  beforeEach(async function () {
    blockNumBefore = await ethers.provider.getBlockNumber();
    blockBefore = await ethers.provider.getBlock(blockNumBefore);
    timestampBefore = blockBefore.timestamp;
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    simpleAuction = await ethers.getContractFactory("SimpleAuction", owner);
    hardhatAuction = await simpleAuction.deploy(blockBefore.timestamp, "600");
  });

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      expect(await hardhatAuction.beneficiary()).to.equal(owner.address);
    });

    it("Should return totalSupply for contract", async function () {
      const ownerBalance = await hardhatAuction.balanceOf(owner.address);
      expect(await hardhatAuction.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Auction bid", function () {

    it("Should return length of bids array == to 1 after 1 bid", async function(){
      fiveMinutes = 60 * 5;
      await ethers.provider.send('evm_increaseTime', [fiveMinutes]);
      await ethers.provider.send('evm_mine');
      blockNumAfter = await ethers.provider.getBlockNumber();
      blockAfter = await ethers.provider.getBlock(blockNumAfter);
      timestampAfter = blockAfter.timestamp;

      expect(timestampAfter-1).to.be.equal(timestampBefore + fiveMinutes);
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")});
      const addruserBidsCount = await hardhatAuction.userBidsCount(addr1.address);
      expect(addruserBidsCount).to.equal(1);
    });

    it("Should transfer ether from address to auction contract", async function (){
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")});
      const contractBalance = await hardhatAuction.getContractBalance();
      expect(contractBalance).to.equal(ethers.utils.parseEther("0.5"));
    });

    it("Shoud fail if bid less than 0.01 ether", async function (){
      await expect(
        hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.001")})
      ).to.be.revertedWith("Bid is too small, min bid is 0.01 ether");
      const initialContractBalance = await hardhatAuction.getContractBalance();
      expect(initialContractBalance).to.equal(await hardhatAuction.getContractBalance());
    });


    it("Should fail if second bid <= than first bid", async function (){
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")});
      await expect(
          hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")})
        ).to.be.revertedWith("There already is a higher bid.");
    });

    it("Should fail if user bids more than 3 times", async function (){
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")});
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.6")});
      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.7")});
      await expect(
        hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.8")})
      ).to.be.revertedWith("Max bids for you is riched!");
    });
  });

  describe("Auction end", function (){
    it("Should fail if auction is not yet ended", async function(){
      await expect(
        hardhatAuction.auctionEnd()
      ).to.be.revertedWith("Auction not yet ended.");
    });

    it("Should fail if auctionEnd was called already", async function(){
       await ethers.provider.send('evm_increaseTime', [Date.now()+100]);
      await hardhatAuction.auctionEnd();
      await expect(
        hardhatAuction.auctionEnd()
      ).to.be.revertedWith("auctionEnd has already been called.");
    });

    it("Should destribute tokens to winners after auction ends", async function(){
      fiveMinutes = 60 * 5;
      tenMinutes = 60 * 10;
      await ethers.provider.send('evm_increaseTime', [fiveMinutes]);
      await ethers.provider.send('evm_mine');

      await hardhatAuction.connect(addr1).bid({value: ethers.utils.parseEther("0.5")});
      await hardhatAuction.connect(addr2).bid({value: ethers.utils.parseEther("0.6")});
      await hardhatAuction.connect(addr3).bid({value: ethers.utils.parseEther("0.7")});

      await ethers.provider.send('evm_increaseTime', [tenMinutes]);
      await ethers.provider.send('evm_mine');

      await hardhatAuction.auctionEnd();

      const addr1Balance = await hardhatAuction.balanceOf(addr1.address);
      const addr2Balance = await hardhatAuction.balanceOf(addr2.address);
      const addr3Balance = await hardhatAuction.balanceOf(addr3.address);

      expect(addr1Balance).to.equal(BigNumber.from("200000000000000000000"));
      expect(addr2Balance).to.equal(BigNumber.from("300000000000000000000"));
      expect(addr3Balance).to.equal(BigNumber.from("500000000000000000000"));

    });
  });
});
