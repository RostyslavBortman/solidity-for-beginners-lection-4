import * as dotenv from 'dotenv'

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-waffle";
//import "@typechain/hardhat";

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const {
  ALCHEMY_KEY,
  ETHERSCAN_API_KEY,
  PRIVATE_KEY_TESTNET
} = process.env;

module.exports = {
  solidity: "0.8.10",

  networks: {
    rinkeby: {
        url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        accounts: [PRIVATE_KEY_TESTNET],
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY
  }
};