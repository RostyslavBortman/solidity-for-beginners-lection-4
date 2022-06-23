// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./RomaToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Auction1 is Ownable {

    uint256 nextId;
    uint256 private startDate;
    uint256 private duration;
    uint256 private nextBidId;
    IERC20 public token;

    bool private finished = false;
    uint256 private highestBid;
    uint256 private maxCountOfBids;
    address[] public usersAddress;
    mapping(address => uint256) private usersAmountOfBid;
    mapping(address => uint256) private countOfBidsPerUser;

    uint256 private BP = 10000;

    constructor(IERC20 _token, uint256 _duration, uint256 _maxCountOfBids){
        require(_duration > 0, "Duration is wrong");
        token = _token;
        startDate = block.timestamp;
        duration = _duration;
        maxCountOfBids = _maxCountOfBids;
    }

    function bid() external payable {
        require(block.timestamp >= startDate, "The auction wasn't started!");
        require(block.timestamp < startDate + duration, "The auction was ended!");
        require(msg.value >= 0.01 ether, "Min bid is 0.01 ether!");
        require(msg.value > highestBid, "Each bid must be greater then previous!");
        require(countOfBidsPerUser[msg.sender] < 3, "The user can do 3 bids maximum in total!");

    
        if(usersAddress.length < maxCountOfBids) {
            usersAddress.push(msg.sender);
        } else if (usersAddress.length == maxCountOfBids){

        address userRefund = usersAddress[0];
        removeBid();
        
        usersAddress.push(msg.sender);

        refund(userRefund);
        }

        countOfBidsPerUser[msg.sender]++;
        usersAmountOfBid[msg.sender] = msg.value;
        highestBid = msg.value;
    }

    function finish() public onlyOwner{
        require(block.timestamp > startDate + duration, "The auction wasn't ended!");
        require(!finished, "The auction has already finished!");
        uint256 currentBalance = token.balanceOf(address(this));
        require(currentBalance > 0, "IERC20 does not have any tokens");

        finished = true;
        uint256 length = usersAddress.length;

        uint256 firstPlace = currentBalance * 5000 / BP;
        console.log("firstPlace %s", firstPlace);
        uint256 secondPlace = currentBalance * 3000 / BP;
        console.log("secondPlace %s", secondPlace);
        uint256 thirdPlace = currentBalance * 2000 / BP;
        console.log("thirdPlace %s", thirdPlace);
        
        token.transfer(usersAddress[length - 1], firstPlace);
        token.transfer(usersAddress[length - 2], secondPlace);
        token.transfer(usersAddress[length - 3], thirdPlace);
    }

    function gethighestBid() public view returns (uint256) {
        return highestBid;
    }

    function getMyBid() public view returns (uint256) {
        return usersAmountOfBid[msg.sender];
    }

    function getMaxCountOfBids() public view returns (uint256) {
        return maxCountOfBids;
    }

    function refund(address _userRefund) private {
        (bool sent, ) = _userRefund.call{value: msg.value}("");
        (sent, "Fail! Ether not sent");

        delete usersAmountOfBid[_userRefund];
    }

    function removeBid() private {
        for (uint256 i = 0; i < maxCountOfBids - 1; i++) {
            usersAddress[i] = usersAddress[i + 1];
        }
        usersAddress.pop();
    }
}
