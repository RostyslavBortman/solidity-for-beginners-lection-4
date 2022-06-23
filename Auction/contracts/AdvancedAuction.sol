// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./RomaToken.sol";
import "hardhat/console.sol";


contract AdvancedAuction{

    struct Auction {
        uint256 id;
        address payable seller;
        string name;
        string description;
        uint256 min;
        uint256 end;
        uint256 bestOfferId;
        uint256[] offerIds;
    }

    struct Offer {
        uint256 id;
        uint256 auctionId;
        address payable buyer;
        uint256 price;
    }

    modifier auctionExist(uint256 _auctionId){
        require(_auctionId >= 0 && _auctionId < nextAuctionId, "Auction does not exist");
        _;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256[]) private userAuctions;
    mapping(address => uint256[]) private userOffers;
    uint256 public nextAuctionId = 0;
    uint256 public nextOfferId = 0;

    function createAuction(
        string memory _name,
        string memory _description,
        uint256 _min,
        uint256 _duration
    )
    external {
        require(_min > 0, "min must be >= 0");
        require(_duration > 86400 && _duration < 864000, "duration must be from 1 - 10 days");
        uint256[] memory _offerIds = new uint256[](1);
        auctions[nextAuctionId] = Auction(
            nextAuctionId,
            payable(msg.sender),
            _name,
            _description,
            _min,
            block.timestamp + _duration,
            0,
            _offerIds
        );
        userAuctions[msg.sender].push(nextAuctionId);
        nextAuctionId++;
    
    }

    function createBid(uint256 _auctionId) external payable auctionExist(_auctionId){
        Auction storage auction = auctions[_auctionId];
        Offer storage bestOffer = offers[auction.bestOfferId];
        require(block.timestamp < auction.end, "Auction has expired");
        require(msg.value >= auction.min && msg.value > bestOffer.price, "msg.value mast be >= current bit");
        auction.bestOfferId = nextOfferId;
        auction.offerIds.push(nextOfferId);
        offers[nextOfferId] = Offer(
            nextOfferId,
            _auctionId,
            payable(msg.sender),
            msg.value
        );
        userOffers[msg.sender].push(nextOfferId);
        nextOfferId++;
    }

    function trade(uint256 _auctionId) external payable auctionExist(_auctionId){
        Auction storage auction = auctions[_auctionId];
        Offer storage bestOffer = offers[auction.bestOfferId];
        require(block.timestamp > auction.end, "Auction is still active");
        for(uint256 i = 0; i < auction.offerIds.length; i++){
            uint256 offerId = auction.offerIds[i];
            if(offerId != auction.bestOfferId){
                Offer storage offer = offers[offerId];
                offer.buyer.transfer(offer.price);
            }
        }
        auction.seller.transfer(bestOffer.price);
    }

    function getAuctions() view external returns (Auction[] memory){
        Auction[] memory _auctions = new Auction[](nextAuctionId);
        for(uint256 i = 0; i < nextAuctionId; i++){
            _auctions[i] = auctions[i];
        }

        return _auctions;
    }

    function getUserAuctions(address _user) view external returns(Auction[] memory){
        uint256[] storage userAuctionIds = userAuctions[_user];
        Auction[] memory _auctions = new Auction[](userAuctionIds.length);
        for(uint256 i = 0; i < userAuctionIds.length; i++){
            uint256 auctionId = userAuctionIds[i];
            _auctions[i] = auctions[auctionId];
        }
        return _auctions;
    }

    function getUserBid(address _user) view external returns(Offer[] memory){
        uint256[] storage userOffersIds = userOffers[_user];
        Offer[] memory _offers = new Offer[](userOffersIds.length);
        for(uint256 i = 0; i < userOffersIds.length; i++){
            uint256 offersId = userOffersIds[i];
            _offers[i] = offers[offersId];
        }
        return _offers;
    }
}