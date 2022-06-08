// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract AuctionL2Token is Ownable, ERC20 {
    uint256 private startDate;
    uint256 private endDate;

    bool private finished = false;
    uint256 private theGreatestBid = 0;
    uint256 private maxCountOfBids;
    address[] private addressesOfMembers;
    mapping(address => uint256) private address2Bid;
    mapping(address => uint256) private countOfBidsPerUser;

    constructor(uint256 _startDate, uint256 _duration, uint256 _maxCountOfBids)
    ERC20("AuctionL2Token", "L2T")
    {
        require(_duration > 0, "Duration is wrong");

        startDate = _startDate;
        endDate = startDate + _duration;
        maxCountOfBids = _maxCountOfBids;
    }

    function sliceFirstAddress() private {
        for (uint256 i = 0; i < maxCountOfBids - 1; i += 1) {
            addressesOfMembers[i] = addressesOfMembers[i + 1];
        }

        addressesOfMembers.pop();
    }

    function refund(address addressForRefund) private {
        payable(addressForRefund).transfer(address2Bid[addressForRefund]);

        delete address2Bid[addressForRefund];
    }

    function bid() external payable {
        require(block.timestamp > startDate, "The auction wasn't started!");
        require(block.timestamp < endDate, "The auction was ended!");
        require(msg.value >= 0.01 ether, "Min bid is 0.01 ether!");
        require(address2Bid[msg.sender] == 0, "You have active bid!");
        require(
            msg.value > theGreatestBid,
            "Each bid must be greater then previous!"
        );
        require(
            countOfBidsPerUser[msg.sender] < 3,
            "The user can do 3 bids maximum in total!"
        );

        countOfBidsPerUser[msg.sender] = countOfBidsPerUser[msg.sender] + 1;
        address2Bid[msg.sender] = msg.value;
        theGreatestBid = msg.value;

        if (addressesOfMembers.length < maxCountOfBids) {
            addressesOfMembers.push(msg.sender);
            return;
        }

        address addressForRefund = addressesOfMembers[0];

        sliceFirstAddress();
        addressesOfMembers.push(msg.sender);

        refund(addressForRefund);
    }

    function finish() public {
        require(block.timestamp > endDate, "The auction wasn't ended!");
        require(!finished, "The auction has already finished!");

        finished = true;
        uint256 length = addressesOfMembers.length;

        if (length == 0) {
            return;
        }

        if (length == 1) {
            _mint(addressesOfMembers[length - 1], 100);
            return;
        }

        if (length == 2) {
            _mint(addressesOfMembers[length - 1], 60);
            _mint(addressesOfMembers[length - 2], 40);
            return;
        }

        _mint(addressesOfMembers[length - 1], 50);
        _mint(addressesOfMembers[length - 2], 30);
        _mint(addressesOfMembers[length - 3], 20);
    }

    function getTheGreatestBid() public view returns (uint256) {
        return theGreatestBid;
    }

    function getMyBid() public view returns (uint256) {
        return address2Bid[msg.sender];
    }

    function getMaxCountOfBids() public view returns (uint256) {
        return maxCountOfBids;
    }
}
