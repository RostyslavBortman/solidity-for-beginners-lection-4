const {expect} = require("chai");
const {ethers, network} = require("hardhat");

describe("AuctionKarpunetsToken", function () {
    let auctionStartAt;
    let duration = 3 * 24 * 60 * 60; // 3 days
    let karpunetsToken;
    let auctionKarpunetsToken;

    beforeEach(async function () {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp;

        const KarpunetsToken = await ethers.getContractFactory("KarpunetsToken");
        karpunetsToken = await KarpunetsToken.deploy();
        await karpunetsToken.deployed();

        // auction start after 5 min
        auctionStartAt = timestampBefore + 5 * 60 * 60

        const AuctionKarpunetsToken = await ethers.getContractFactory("AuctionKarpunetsToken");
        auctionKarpunetsToken = await AuctionKarpunetsToken.deploy(karpunetsToken.address, auctionStartAt, duration);
        await auctionKarpunetsToken.deployed();

        await karpunetsToken.approve(auctionKarpunetsToken.address, ethers.utils.parseUnits("100", 18))
    });

    // When auction is finished, the last 3 bidders (winners) should be able to withdraw ERC20 tokens
    // from the contract in proportion (50% for the 1 place, 30% for the 2nd, 20% for the 3rd);
    it("Auction contract integration test", async function () {

        const [signer, user1, user2, user3, user4] = await ethers.getSigners();

        const signerBalanceBefore = await getBalance(signer)
        const user1BalanceBefore = await getBalance(user1)
        const user2BalanceBefore = await getBalance(user2)
        const user3BalanceBefore = await getBalance(user3)
        const user4BalanceBefore = await getBalance(user4)

        await startAuction()

        await expectMyBid(signer, 0, "0", 0);

        await bit(user1, "0.1")
        await expectMyBid(user1, 1, "0.1", 1);

        await bit(user2, "1")
        await expectMyBid(user1, 2, "0.1", 1);
        await expectMyBid(user2, 1, "1", 1);

        await bit(user3, "2")
        await bit(user4, "4")
        await bit(user1, "4")

        await expectMyBid(user1, 1, "4.1", 2);
        await expectMyBid(user2, 4, "1", 1);
        await expectMyBid(user3, 3, "2", 1);
        await expectMyBid(user4, 2, "4", 1);

        await finishAuction();

        await withdraw(user1)
        await withdraw(user2)
        await withdraw(user3)
        await withdraw(user4)

        const signerBalanceAfter = await getBalance(signer)
        const user1BalanceAfter = await getBalance(user1)
        const user2BalanceAfter = await getBalance(user2)
        const user3BalanceAfter = await getBalance(user3)
        const user4BalanceAfter = await getBalance(user4)

        expectEtherChanged(signerBalanceBefore, signerBalanceAfter, "10.1")
        expectEtherChanged(user1BalanceBefore, user1BalanceAfter, "-4.1")
        expectEtherChanged(user2BalanceBefore, user2BalanceAfter, "0")
        expectEtherChanged(user3BalanceBefore, user3BalanceAfter, "-2")
        expectEtherChanged(user4BalanceBefore, user4BalanceAfter, "-4")

        expectTokenChanged(signerBalanceBefore, signerBalanceAfter, "-100")
        expectTokenChanged(user1BalanceBefore, user1BalanceAfter, "50")
        expectTokenChanged(user2BalanceBefore, user2BalanceAfter, "0")
        expectTokenChanged(user3BalanceBefore, user3BalanceAfter, "20")
        expectTokenChanged(user4BalanceBefore, user4BalanceAfter, "30")
    });

    it("Min bid for the auction contract is 0.01 eth", async function () {
        const [, user] = await ethers.getSigners();
        await startAuction()
        await expect(bit(user, "0.05")).to.be.revertedWith("less than start bid")
    });

    it("Each bid must be > then previous", async function () {
        const [, user1, user2] = await ethers.getSigners();
        await startAuction()
        await bit(user1, "5")
        await expect(bit(user2, "4")).to.be.revertedWith("less than max bid")
    });

    it("Each bid must be > then previous", async function () {
        const [, user] = await ethers.getSigners();
        await startAuction()
        const userBalanceBefore = await getBalance(user)
        await expect(bit(user, "21")).to.be.revertedWith("too high price")
        const userBalanceAfter = await getBalance(user)
        expectEtherChanged(userBalanceBefore, userBalanceAfter, "0")
    });

    it("User can't bid if auction has not started yet or if it's already finished", async function () {
        const [, user] = await ethers.getSigners();
        await expect(bit(user, "5")).to.be.revertedWith("auction not started")
        await startAuction()
        await bit(user, "5")
        await finishAuction();
        await expect(bit(user, "6")).to.be.revertedWith("auction finished")
    });

    it("User can do 3 bids maximum in total", async function () {
        const [, user] = await ethers.getSigners();
        await startAuction()
        await bit(user, "1")
        await bit(user, "2")
        await bit(user, "3")
        await expect(bit(user, "4")).to.be.revertedWith("attempt limit exceeded")
    });

    async function startAuction() {
        await network.provider.send("evm_setNextBlockTimestamp", [auctionStartAt]);
        await network.provider.send("evm_mine");
    }

    async function finishAuction() {
        await network.provider.send("evm_increaseTime", [duration])
        await network.provider.send("evm_mine")
    }

    async function getBalance(signerOrProvider) {
        return {
            token: await karpunetsToken.balanceOf(signerOrProvider.address),
            ether: await ethers.provider.getBalance(signerOrProvider.address)
        }
    }

    async function bit(signerOrProvider, ether) {
        console.log(signerOrProvider.address + " bit " + ether);
        return auctionKarpunetsToken.connect(signerOrProvider).bid({
            value: ethers.utils.parseEther(ether)
        })
    }

    async function withdraw(signerOrProvider) {
        await auctionKarpunetsToken.connect(signerOrProvider).withdraw()
    }

    async function expectMyBid(signerOrProvider, position, ether, attempt) {
        const signerBid = await auctionKarpunetsToken.connect(signerOrProvider).myBid()
        expect(signerBid.position).to.equal(position);
        expect(signerBid.details.amount).to.equal(ethers.utils.parseEther(ether));
        expect(signerBid.details.attempt).to.equal(attempt);
    }

    function expectEtherChanged(before, after, ether) {
        let current = parseFloat(ethers.utils.formatEther(after.ether - before.ether + "")).toFixed(1);
        current = current === '-0.0' ? "0.0" : current
        expect(parseFloat(ether).toFixed(1)).to.equal(current);
    }

    function expectTokenChanged(before, after, tokens) {
        expect(after.token - before.token + "").to.equal(ethers.utils.parseUnits(tokens, 18));
    }
});
