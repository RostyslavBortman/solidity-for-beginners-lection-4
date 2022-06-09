//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract KarpunetsToken is ERC20 {
    uint256 maxTokenAllowed = 500 * 10 ** uint(decimals());
    uint tokenRate = 100;

    constructor() ERC20("Karpunets", "KRPNTS") {
        uint256 ownerAmount = 1000 * 10 ** uint(decimals());
        _mint(msg.sender, ownerAmount);
        console.log("mint 100 to ", msg.sender);
    }

    function buy() payable public {
        require(msg.value > 0, 'ETH value should be more than 0');
        uint256 tokenAdded = msg.value * tokenRate;
        require(balanceOf(msg.sender) + tokenAdded <= maxTokenAllowed, 'Your account allowed only 500 tokens');
        _mint(msg.sender, tokenAdded);
        console.log("mint ", tokenAdded / 10 ** uint(decimals()), " to ", msg.sender);
    }
}

