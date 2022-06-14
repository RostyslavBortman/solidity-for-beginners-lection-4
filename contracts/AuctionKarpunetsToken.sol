//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./KarpunetsToken.sol";

contract AuctionKarpunetsToken {
    event Bid(address indexed sender, uint amount);
    event Withdraw(address indexed bidder, uint amount);

    struct BirdDetails {
        uint amount;
        uint date;
        uint8 attempt;
    }

    struct BirdDetailsPosition {
        BirdDetails details;
        uint position;
    }

    uint8 public constant MAX_USER_ATTEMPT = 3;
    uint8 public constant TOKEN_AMOUNT = 100;
    uint public constant MAX_BID_AMOUNT = 20 ether;
    uint public constant MIN_BID_AMOUNT = 0.1 ether;

    KarpunetsToken immutable public token;
    address payable public immutable seller;
    uint public immutable startDate;
    uint public immutable duration;
    mapping(address => BirdDetails) public bids;
    address[] public bidsOrder;
    address[3] public winners;
    uint8[3] public winnerCoefficients = [50, 30, 20];

    constructor(address _token, uint _startDate, uint _duration) {
        token = KarpunetsToken(_token);
        seller = payable(msg.sender);
        startDate = _startDate;
        duration = _duration;
    }

    function bid() payable external {
        require(startDate < block.timestamp, "auction not started");
        require(block.timestamp < startDate + duration, "auction finished");
        require(msg.value <= MAX_BID_AMOUNT, "too high price");
        BirdDetails memory details = bids[msg.sender];
        uint bidAmount = details.amount + msg.value;
        if (bidsOrder.length == 0) {
            require(msg.value >= MIN_BID_AMOUNT, "less than start bid");
        } else {
            require(bidAmount > bids[bidsOrder[bidsOrder.length - 1]].amount, "less than max bid");
        }
        require(details.attempt < MAX_USER_ATTEMPT, "attempt limit exceeded");
        bids[msg.sender] = BirdDetails(bidAmount, block.timestamp, details.attempt + 1);
        bidsOrder.push(msg.sender);
        emit Bid(msg.sender, bidAmount);
    }

    function myBid() public view returns (BirdDetailsPosition memory) {
        BirdDetails memory details = bids[msg.sender];
        for (uint i = bidsOrder.length; i > 0; i--) {
            if (bidsOrder[i - 1] == msg.sender) {
                return BirdDetailsPosition(details, bidsOrder.length - i + 1);
            }
        }
        return BirdDetailsPosition(details, 0);
    }

    function withdraw() external {
        require(startDate < block.timestamp, "auction not started");
        require(block.timestamp > startDate + duration, "auction not finished");
        BirdDetails memory details = bids[msg.sender];
        bool winner;
        for (uint i = 0; i < winners.length; i++) {
            if (bidsOrder[bidsOrder.length - i - 1] == msg.sender && winners[i] == address(0)) {
                uint tokenAmount = TOKEN_AMOUNT * 10 ** uint(token.decimals()) * winnerCoefficients[i] / 100;
                require(token.transferFrom(seller, msg.sender, tokenAmount), "transfer fails");
                seller.transfer(details.amount);
                winners[i] = msg.sender;
                winner = true;
            }
        }
        if (!winner) {
            payable(msg.sender).transfer(details.amount);
        }
    }
}
