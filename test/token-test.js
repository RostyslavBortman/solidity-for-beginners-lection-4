const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("KarpunetsToken", function () {
    it("Should owner get 1000 tokens after deploy", async function () {
        const [owner] = await ethers.getSigners();

        const KarpunetsToken = await ethers.getContractFactory("KarpunetsToken");
        const karpunetsToken = await KarpunetsToken.deploy();
        await karpunetsToken.deployed();

        const ownerBalance = await karpunetsToken.balanceOf(owner.address)
        expect(await karpunetsToken.totalSupply()).to.equal(ownerBalance);
        expect(ownerBalance).to.equal(ethers.utils.parseUnits("1000", 18));
    });

    it("Should buy tokens but not more that 500", async function () {
        const [, user] = await ethers.getSigners();

        const KarpunetsToken = await ethers.getContractFactory("KarpunetsToken");
        const karpunetsToken = await KarpunetsToken.deploy();
        await karpunetsToken.deployed();

        karpunetsToken.connect(user).buy({
            value: ethers.utils.parseEther("1.0")
        })
        expect(await karpunetsToken.connect(user).balanceOf(user.address)).to.equal(ethers.utils.parseUnits("100", 18));

        karpunetsToken.connect(user).buy({
            value: ethers.utils.parseEther("4.0")
        })
        expect(await karpunetsToken.connect(user).balanceOf(user.address)).to.equal(ethers.utils.parseUnits("500", 18));

        expect(karpunetsToken.connect(user).buy({
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith("Your account allowed only 500 tokens");
    });
});
