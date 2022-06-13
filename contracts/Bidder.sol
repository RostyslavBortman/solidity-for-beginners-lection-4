//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);


    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract KhominToken is IERC20 {

    uint256 public _totalSupply;
    uint256 public _inUse;
    string public _name = "Khomin Token";
    string public _symbol = "KHTK";
    uint8 public _decimals = 2;

    mapping(address => uint) public _balances;
    mapping(address => mapping(address => uint)) public _allowance;

    function transfer(address _to, uint256 _value) public returns (bool success) {
        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        _allowance[_from][msg.sender] -= _value;
        _balances[_from] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        _allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return _allowance[_owner][_spender];
    }

    constructor(uint __totalSupply) {
        _totalSupply = __totalSupply;
        _balances[msg.sender] = __totalSupply;
    }

}

// Bidder is a simple contract that contains 20 last bids.
contract Bidder {

    IERC20 public token;

    // constructor sets startTime and duration
    constructor(uint _startTime, uint _duration, uint _totalSupply) {
        startTime = _startTime;
        duration = _duration;
        token = new KhominToken(_totalSupply);
    }

    // startTime is the time when the contract starts.
    uint public startTime;

    // duration is the duration of the contract.
    uint public duration;

    // Min bid is the minimum bid that can be placed.
    uint constant public minBid = 0.01 ether;

    // Amount of bids that can be stored.
    uint constant public maxBids = 20;

    // Total amount of bids for each user.
    uint constant public totalBids = 3;

    // Amount of bids made by each user.
    mapping(address => uint) public bidAmounts;

    // The last 20 bids.
    uint[maxBids] public lastBids;
    address[maxBids] public bidders;
    uint public lastBidIndex = 0;
    uint public prevBidIndex = 0;

    uint public totalBidAmount = 0;

    // Index of the first bid.
    uint public firstBidIndex = 0;

    address[3] public winners;

    // getBids returns the last 20 bids.
    function getBids() public view returns (uint[maxBids] memory _lastBids) {
        return lastBids;
    }

    // setWinners returns the last 3 winners. Sends tokens to the winners.
    function setWinners() public {
        require(block.timestamp > startTime + duration, "The contract has not ended yet.");

        if (totalBidAmount == 0) {
            return;
        }
        if (totalBidAmount >= 1) {
            winners[0] = bidders[(maxBids + prevBidIndex) % maxBids];
            token.transfer(winners[0], token.totalSupply() * 50 / 100);
        }
        if (totalBidAmount >= 2) {
            winners[1] = bidders[(maxBids + prevBidIndex - 1) % maxBids];
            token.transfer(winners[1], token.totalSupply() * 30 / 100);
        }
        if (totalBidAmount >= 3) {
            winners[2] = bidders[(maxBids + prevBidIndex - 2) % maxBids];
            token.transfer(winners[2], token.totalSupply() * 20 / 100);
        }
    }

    // Bid is a function that allows a user to place a bid.
    // The bid is placed in the lastBids array and the lastBidIndex is incremented.
    // The bid is only placed if the bid is greater than the last bid.
    // The bid is only placed if the bid is greater than the minimum bid.
    // The bid is only placed if the user has enough ether to pay for the bid.
    function bid() public payable {
        require(msg.value > minBid, "Bid must be greater than minBid");
        require(msg.value > lastBids[prevBidIndex], "Bid must be greater than lastBid");
        require(bidAmounts[msg.sender] < totalBids, "You have reached the maximum amount of bids");
        require(block.timestamp >= startTime, "Bid must be placed after startTime");
        require(block.timestamp <= startTime + duration, "Bid must be placed before endTime");


        bidAmounts[msg.sender]++;
        totalBidAmount++;

        if (totalBidAmount > maxBids) {
            payable(bidders[firstBidIndex]).transfer(lastBids[firstBidIndex]);

            firstBidIndex++;
            firstBidIndex %= maxBids;
        }

        lastBids[lastBidIndex] = msg.value;
        bidders[lastBidIndex] = msg.sender;
        prevBidIndex = lastBidIndex;
        lastBidIndex++;
        lastBidIndex %= maxBids;


    }
}
