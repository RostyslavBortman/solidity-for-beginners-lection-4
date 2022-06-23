/* eslint-disable spaced-comment */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
const { expect, assert } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const { increaseTime } = require("./utils/timeManipulation");

let Auction1;
let auction1;
let RomaToken;
let romaToken;
let owner, user1, user2, user3, user4, user5;

const duration = 86400; 
const increaseDuration = duration + 86400;


const _provider = new ethers.providers.JsonRpcProvider(web3.currentProvider.host);

describe("Auction1", function() {

    beforeEach(async function() {
        [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

        RomaToken = await ethers.getContractFactory("RomaToken");
        romaToken = await RomaToken.deploy();
        await romaToken.deployed();
        
        Auction1 = await ethers.getContractFactory("Auction1");
        auction1 = await Auction1.deploy(romaToken.address, duration, 5);
        await auction1.deployed();

        await romaToken.transfer(auction1.address, "1000000000000000000000");
    });

    it("should deploy with 1M supply", async function() {
        const balance = await romaToken.balanceOf(auction1.address);
        console.log(balance.toString());
        expect(balance.toString()).to.equal("1000000000000000000000");
    });

    it("should place a Bid", async function() {
        await auction1.connect(user1).bid({ value: "1000000000000000000" });
    });

    it("should Not place a Bid with lower amount", async function() {
        await auction1.connect(user1).bid({ value: "1000000000000000000" });
        
        await truffleAssert.reverts(
            auction1.connect(user2).bid({ value: "10000000000000000" })
        );
    });


    describe("Remove lowest Bid", function(){
        it("should refund the bid with the lowest value when the auction reaches maximum of bids", async function(){
            await auction1.connect(owner).bid({ value: "10000000000000000" });
            await auction1.connect(user1).bid({ value: "1000000000000000000" });
            await auction1.connect(user2).bid({ value: "2000000000000000000" });
            await auction1.connect(user3).bid({ value: "3000000000000000000" });
            await auction1.connect(user4).bid({ value: "4000000000000000000" });
            await auction1.connect(user5).bid({ value: "5000000000000000000" });

            const result0 = await auction1.usersAddress(0);
            const result1 = await auction1.usersAddress(1);
            const result2 = await auction1.usersAddress(2);
            const result3 = await auction1.usersAddress(3);
            const result4 = await auction1.usersAddress(4);
            console.log("-->", result0, result1, result2, result3, result4)
            
            expect(result0).to.equal(user1.address);
            expect(result1).to.equal(user2.address);
            expect(result2).to.equal(user3.address);
            expect(result3).to.equal(user4.address);
            expect(result4).to.equal(user5.address);
        })
    })

    describe("Auction has finished", function() {
        
        it("should allow to owner finish an auction", async function() {

            await auction1.connect(owner).bid({ value: "10000000000000000" });
            await auction1.connect(user1).bid({ value: "1000000000000000000" });
            await auction1.connect(user2).bid({ value: "2000000000000000000" });
            await auction1.connect(user3).bid({ value: "3000000000000000000" });
            await auction1.connect(user4).bid({ value: "4000000000000000000" });
            await auction1.connect(user5).bid({ value: "5000000000000000000" });

            await increaseTime({ ethers }, increaseDuration);
            await auction1.finish();

            const balance1 = await romaToken.balanceOf(user5.address);
            console.log(balance1.toString());
            expect(balance1.toString()).to.equal("500000000000000000000");

            const balance2 = await romaToken.balanceOf(user4.address);
            console.log(balance1.toString());
            expect(balance2.toString()).to.equal("300000000000000000000");

            const balance3 = await romaToken.balanceOf(user3.address);
            console.log(balance3.toString());
            expect(balance3.toString()).to.equal("200000000000000000000");
            
        })

        it("should NOT allow to owner finish an auction before end time", async function() {
            await truffleAssert.reverts(
                auction1.finish()
            );
        })

    })

})