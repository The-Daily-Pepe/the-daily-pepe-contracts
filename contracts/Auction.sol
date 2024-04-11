// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "./FirstEditionArticleNFT.sol";

contract NFTAuction is AccessControl, IERC721Receiver, ReentrancyGuard {
  bytes4 constant ADMIN_ROLE = 0x69696969;
  
  FirstEditionArticleNFT public NFTContract;

  address payable private benefactor;
  
  //maps ids of auctioned tokens to their auction end times
  mapping (uint256 => uint256) public auctionDeadlines;
  //maps ids of auctioned tokens to their current winning bids
  mapping (uint256 => uint256) public winningBids;
  //maps ids of auctioned tokens to their current winning payout addresses
  mapping (uint256 => address) public winningPayoutAddresses;
  //maps ids of auctioned tokens to their current winning bidder addresses
  mapping (uint256 => address payable) public winningBidderAddresses;

  uint256 public minAuctionDuration;

  //the minimum percentage a bid must be raised to get the new winning bid
  uint256 public minRaise;

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  constructor(address _nftAddress, uint256 _minAuctionDuration, address admin, address payable _benefactor) {
    minAuctionDuration = _minAuctionDuration;
    NFTContract = FirstEditionArticleNFT(_nftAddress);
    _setupRole(ADMIN_ROLE, admin);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
    benefactor = _benefactor;
  }

  function setBenefactor(address payable newBenefactor) external onlyAdmin {
    //transfer everything to old benefactor first
    withdraw();
    benefactor = newBenefactor;
  }

  function withdraw() public {
    benefactor.transfer(address(this).balance - 1);
  }

  function getMinBid(uint256 tokenId) public view returns (uint256) {
    uint256 winningBid = winningBids[tokenId];
    return winningBid + (winningBid * minRaise / 100);
  }

  function bid(uint256 tokenId, address payoutAddress) external payable nonReentrant {
    require(msg.value > getMinBid(tokenId), "bid not high enough");
    require(auctionDeadlines[tokenId] >= block.timestamp, "auction has ended");
    //pay back the previous winning bidder
    winningBidderAddresses[tokenId].transfer(winningBids[tokenId]);

    //set the new winning bidder
    winningBids[tokenId] = msg.value;
    winningPayoutAddresses[tokenId] = payoutAddress;
    winningBidderAddresses[tokenId] = msg.sender;
  }

  //send the winners their tokens
  function payoutAll() public {
    uint256 numTokens = NFTContract.balanceOf(address(this));
    
    //make sure we don't accumulate so many tokens that we run out of gas calling this
    if (numTokens > 10) {
      numTokens = 10;
    }

    //transfer each token if the auction deadline has passed
    for (uint256 i = 0; i < numTokens; i++) {
      uint256 tokenId = NFTContract.tokenOfOwnerByIndex(address(this), i);
      if (block.timestamp > auctionDeadlines[tokenId]) {
        NFTContract.transferFrom(address(this), winningPayoutAddresses[tokenId], tokenId);
      }
    }
  }

  function onERC721Received(address /*operator*/, address /*from*/, uint256 tokenId, bytes calldata /*data*/) external view override returns (bytes4) {
    //can only receive the specified type of NFT
    if (msg.sender != address(NFTContract)) {
      revert("NFTAuction can't receive this NFT");
    }
    //can only receive if an auction hasn't started yet
    if (auctionDeadlines[tokenId] != 0) {
      revert("NFT already auctioned");
    }
    return this.onERC721Received.selector;
  }

  function createTokenAndStartAuction(string calldata uri, uint256 auctionDeadline) public onlyAdmin {
    require(auctionDeadline > block.timestamp + minAuctionDuration, "insufficient auction time");
    uint256 tokenId = NFTContract.createNewArticle(address(this), uri);
    auctionDeadlines[tokenId] = auctionDeadline;


  }

}