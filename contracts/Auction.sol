// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract SimpleAuction is ERC20 {

    bool ended;

    uint public mapBidsSize;
    uint public auctionStartTime;
    uint public auctionEndTime;
    uint public highestBid;

    address public highestBidder;
    address payable public beneficiary;

    address[] public twentyAdresses;

    mapping(address => uint) public userBidsCount;
    mapping(address => Bid) public allBids;

    struct Bid {
        uint deposit;
        uint place;
        uint bidTime;
    }

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor(uint _auctionStartTime, uint _biddingTime) ERC20("VRaboshchukToken", "VRBCHT"){
        beneficiary = payable(msg.sender);
        auctionStartTime = _auctionStartTime;
        auctionEndTime = auctionStartTime + _biddingTime;
        _mint(msg.sender,1000*10**18);
    }

    function getContractBalance() external view returns(uint) {
      return address(this).balance;
    }

    modifier auctioRequirements {
        require(block.timestamp > auctionStartTime, "Auction isnt started yet");
        require(block.timestamp <= auctionEndTime, "Auction already ended.");
        require(msg.value >= 0.01 ether, "Bid is too small, min bid is 0.01 ether");
        require(userBidsCount[msg.sender] < 3, "Max bids for you is riched!");
        require(msg.value > highestBid, "There already is a higher bid.");
        _;
    }

    function bid() public payable auctioRequirements() {

        highestBidder = msg.sender;
        highestBid = msg.value;
        userBidsCount[msg.sender] += 1;
        allBids[highestBidder] = Bid(highestBid, mapBidsSize, block.timestamp);
        twentyAdresses.push(highestBidder);


        if (twentyAdresses.length > 3) {
            // payable(twentyAdresses[0]).transfer(allBids[twentyAdresses[0]].deposit);
                for (uint256 i = 0; i < twentyAdresses.length - 1; i += 1) {
                    twentyAdresses[i] = twentyAdresses[i + 1];
                    }
                twentyAdresses.pop();
        }

        mapBidsSize++;

        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function tokenDistribution() public  {
        if (twentyAdresses.length == 0) {
            return;
        }

        if (twentyAdresses.length == 1) {
            ERC20.transfer(twentyAdresses[0], ERC20.totalSupply() * 50 / 100);
        }

        if (twentyAdresses.length == 2) {
            ERC20.transfer(twentyAdresses[twentyAdresses.length-1], ERC20.totalSupply() * 50 / 100);
            ERC20.transfer(twentyAdresses[twentyAdresses.length-2], ERC20.totalSupply() * 30 / 100);

        }

        if (twentyAdresses.length >=3) {
            ERC20.transfer(twentyAdresses[twentyAdresses.length-1], ERC20.totalSupply() * 50 / 100);
            ERC20.transfer(twentyAdresses[twentyAdresses.length-2], ERC20.totalSupply() * 30 / 100);
            ERC20.transfer(twentyAdresses[twentyAdresses.length-3], ERC20.totalSupply() * 20 / 100);
        }

    }

    function auctionEnd() public {

        // 1. Conditions
        require(block.timestamp >= auctionEndTime, "Auction not yet ended.");
        require(!ended, "auctionEnd has already been called.");

        // 2. Effects
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        // 3. Interaction
        beneficiary.transfer(highestBid);

        tokenDistribution();

    }
}
