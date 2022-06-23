/* eslint-disable spaced-comment */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
const { expect, assert } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const { increaseTime } = require('./utils/timeManipulation');

let AdvancedAuction;
let auction;
let creator, user1, user2;

// const provider = ethers.getDefaultProvider();
const _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);

describe("AdvancedAuction", function(){
    beforeEach(async function() {
        [creator, user1, user2] = await ethers.getSigners();

        AdvancedAuction = await ethers.getContractFactory("AdvancedAuction");
        auction = await AdvancedAuction.deploy();
        await auction.deployed();
    })

    describe("Create an Auction", function() {
        it("should Create an Auction for more than one day", async function() {
            await auction.createAuction("Name", "Description", ethers.utils.parseEther("0.01"), 86401);
            const result = await auction.getUserAuctions(creator.address);
            console.log("----->", result[0]);
            assert(result[0].id.toString() === "0");
            assert(result[0].seller.toString() === "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            assert(result[0].name.toString() === "Name");
            assert(result[0].description.toString() === "Description");
            assert(result[0].min.toString() === "10000000000000000");
            assert(result[0].bestOfferId.toString() === "0");
            assert(result[0].offerIds.toString() === "0");
        })

        it("should NOT an Create Auction fot less than one day ", async function() {
            await truffleAssert.reverts(
                auction.createAuction("Name", "Description", ethers.utils.parseEther("0.01"), 86400)
            );
        })
    })

    describe("Create a Bid", function(){
        it("should create a Bid", async function() {
            await auction.createAuction("Name2", "Description2", ethers.utils.parseEther("1"), 86401);
            await auction.createBid(0, { value:ethers.utils.parseEther("1")});
        });

        it("should NOT be able to create a Bid with lower amount", async function() {
            await auction.createAuction("Name2", "Description2", ethers.utils.parseEther("1"), 86401);
            await truffleAssert.reverts(
                auction.connect(user1).createBid(0, { value:ethers.utils.parseEther("0.99")})
            );
        })

        it("should NOT be able to creat a Bid after auction has passed", async function(){
            await auction.createAuction("Name2", "Description2", ethers.utils.parseEther("1"), 86900);
            await increaseTime({ ethers }, 86999);
            await truffleAssert.reverts(
                auction.connect(user1).createBid(0, { value:ethers.utils.parseEther("2")})
            );
        })

        it("should overbid current highest Bid", async function() {
            await auction.createAuction("Name3", "Description3", ethers.utils.parseEther("1"), 86499);
            await auction.connect(user1).createBid(0, { value:ethers.utils.parseEther("2")});
            await auction.connect(user2).createBid(0, { value:ethers.utils.parseEther("4")});
            const result = await auction.getUserAuctions(creator.address);
            console.log("--->", result[0]);
            assert(result[0].bestOfferId.toString() === "1");
        });

        it("should see users Bid", async function() {
            await auction.createAuction("Name3", "Description3", ethers.utils.parseEther("1"), 86499);
            await auction.connect(user1).createBid(0, { value:ethers.utils.parseEther("2")});
            const userBid = await auction.getUserBid(user1.address);
            // console.log("--->", await auction.getUserBid(user1.address));
            assert(userBid[0].price.toString() === "2000000000000000000");
        });
    
    })

    describe("Trade an Auction", function() {
        it("should trade", async function(){
            await auction.createAuction("Name7", "Description7", "1000000000000000000", 86401);
            await auction.connect(user1).createBid(0, { value: "2000000000000000000"});
            await auction.connect(user2).createBid(0, { value: "4000000000000000000"});

            const balanceBefore = await _provider.getBalance(creator.address);
            console.log("Before--->", balanceBefore.toString());
            const balanceUserBefore = await _provider.getBalance(user1.address);
            console.log("BeforeUser--->", balanceUserBefore.toString());

            await increaseTime({ ethers }, 864099);
            
            await auction.connect(user2).trade(0, { value: "4000000000000000000" });
            // const balanceAfter = await provider.getBalance(creator.address);
            const balanceAfter = await _provider.getBalance(creator.address);
            console.log("After--->", balanceAfter.toString());
            const balanceUserAfter = await _provider.getBalance(user1.address);
            console.log("AfterUser--->", balanceUserAfter.toString());
            
            await auction.connect(user1).trade(0);
        })
    })    
})