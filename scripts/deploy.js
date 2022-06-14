// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    const KarpunetsToken = await hre.ethers.getContractFactory("KarpunetsToken");
    const karpunetsToken = await KarpunetsToken.deploy();

    await karpunetsToken.deployed();

    console.log("KarpunetsToken deployed to:", karpunetsToken.address);

    const AuctionKarpunetsToken = await hre.ethers.getContractFactory("AuctionKarpunetsToken");
    const auctionStartAt = Math.floor(Date.now() / 1000) + 3 * 60 * 60 // auction start after 3 min
    const duration = 60 * 60 // 1 hour
    const auctionKarpunetsToken = await AuctionKarpunetsToken.deploy(karpunetsToken.address, auctionStartAt, duration);

    console.log("AuctionKarpunetsToken deployed to:", auctionKarpunetsToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
