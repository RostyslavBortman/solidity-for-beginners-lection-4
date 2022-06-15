// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Auction is ERC20 {

    struct Bid {
        uint256 [] bids;
        address sender;
    }

    address public owner;
    uint public highestBid;
    uint public startAt;
    uint public endAt;
    bool public ended;

    uint private maxCountOfBids;
    uint8 constant maxCountOfBidsPerMember = 3;
    
    mapping(address => Bid) private bids;
    address [] private memberAddresses;

    constructor(uint _startAt, uint _duration, uint _maxCountOfBids) ERC20("Auction", "AUC") {
        startAt = _startAt;
        endAt = startAt + _duration;
        maxCountOfBids = _maxCountOfBids;
        owner = msg.sender;
    }

    function finish() public {
        require(block.timestamp >= startAt, "not started");
        require(block.timestamp >= endAt, "not ended");
        require(!ended, "already ended");

        uint length = memberAddresses.length;

        if (length == 0) {
            return;
        }

        if (length == 1) {
            transferPrize(100, memberAddresses[length - 1]);
            return;
        }

        if (length == 2) {
            transferPrize(60, memberAddresses[length - 1]);
            transferPrize(40, memberAddresses[length - 2]);
            return;
        }

        transferPrize(50, memberAddresses[length-1]);
        transferPrize(30, memberAddresses[length-2]);
        transferPrize(20, memberAddresses[length-3]);

        ended = true;
    }

    function placeBid() public payable {
        console.log("called `placeBid`, block.timestamp: %d, startAt: %d, endAt: %d", block.timestamp, startAt, endAt);
        require(block.timestamp > startAt, "The auction has not started yet");
        require(block.timestamp < endAt, "The auction has already ended");
        uint newBid = msg.value;
        address sender = msg.sender;

        require(newBid >= 0.01 ether, "bit should be > 0.01");
        require(newBid > highestBid, "bit should be > highestBid");
        require(bids[sender].bids.length < maxCountOfBidsPerMember, "The user can make only 3 bids");

        highestBid = newBid;

        if (memberAddresses.length < maxCountOfBids) {
            addBid(sender, newBid);
            return;
        }

        address addressForRefund = memberAddresses[0];
        Bid memory bidForRefund = bids[addressForRefund];
        payable(addressForRefund).transfer(bidForRefund.bids[0]);
        removeMember(0);
        removeBid(addressForRefund, 0);

        addBid(sender, newBid);
    }

    function addBid(address _memberAddress, uint256 _amount) private {
        bids[_memberAddress].bids.push(_amount);
        memberAddresses.push(_memberAddress);
    }

    function transferPrize(uint _percent, address _to) private {
        uint balance = address(this).balance;
        uint amount = balance * _percent / 100;
        payable(_to).transfer(amount);
    }

    function removeMember(uint _index) private {
        if (_index >= memberAddresses.length) return;

        for (uint i = _index; i<memberAddresses.length-1; i++){
            memberAddresses[i] = memberAddresses[i+1];
        }
        memberAddresses.pop();
    }

    function removeBid(address _address, uint _index) private {
        if (_index >= bids[_address].bids.length) return;

        for (uint i = _index; i<bids[_address].bids.length-1; i++){
            bids[_address].bids[i] = bids[_address].bids[i+1];
        }
        bids[_address].bids.pop();
    }

    function getBid() public view returns (Bid memory) {
        return bids[msg.sender];
    } 
}