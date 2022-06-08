// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract OlashynDmytroToken is Ownable, ERC20 {
    uint private constant _maxSupply = 20 * 1000;
    uint private constant _maxAllowedTokens = 500;
                                        
    constructor(address _mentorAddres) ERC20("OlashynToken", "ODT") {
        _mint(msg.sender, 150);
        _mint(_mentorAddres, 120);
    }

    function getTokens() external payable {
        require(msg.value > 0, "Need ETH to buy ODT!");

        uint amount = msg.value / 1e18 * 100;

        uint256 newBalanceOfReceiver = balanceOf(msg.sender) + amount;
        require(newBalanceOfReceiver <= _maxAllowedTokens, "No more than 500 ODTs per user");

        uint avaliableSupply = _maxSupply - totalSupply() - amount - 10;
        require(avaliableSupply >= amount, "No more ODT available!");
        
        payable(owner()).transfer(msg.value);

        _mint(msg.sender, amount);
    }
}
