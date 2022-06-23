const increaseTime = ({ web3, ethers }, seconds) => {
  if (web3) {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [parseInt(seconds, 10)],
        id: 1,
      },
      () => {}
    );
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [],
        id: 2,
      },
      () => {}
    );
  }

  if (ethers) {
    ethers.provider.send("evm_increaseTime", [parseInt(seconds, 10)]);
    ethers.provider.send("evm_mine");
  }
};

module.exports = { increaseTime };
