// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RomaToken is ERC20 {
    constructor() ERC20("RomaToken", "ROMA") {
        _mint(msg.sender, 1000 * (10**18));
    }
}