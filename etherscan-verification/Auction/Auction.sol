// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ReentrancyGuard.sol";
import "./AccessControl.sol";
import "./IERC721Receiver.sol";
import "./FirstEditionArticleNFT.sol";

contract Auction is AccessControl, IERC721Receiver, ReentrancyGuard {
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
  uint256 public maxAuctionDuration;

  //the percentage minimum raise (ex: 5%)
  uint256 public minRaisePct;

  //the absolute minimum raise (ex: 0.01 eth)
  uint256 public minRaiseAbs;

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  constructor(
    address _nftAddress,
    uint256 _minAuctionDuration, 
    uint256 _maxAuctionDuration,
    uint256 _minRaisePct,
    uint256 _minRaiseAbs,
    address admin, 
    address payable _benefactor
    ) {
    minRaisePct = _minRaisePct;
    minRaiseAbs = _minRaiseAbs;
    minAuctionDuration = _minAuctionDuration;
    maxAuctionDuration = _maxAuctionDuration;
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

  //purely for recovery operations in case someone sends money to this contract
  //by mistake or tokens get stuck in here because of a bug.
  function adminRecovery(address target, bytes calldata functionCall) public payable onlyAdmin {
    target.call{
      value: msg.value
    }(functionCall);
  }

  function withdraw() public {
    benefactor.transfer(address(this).balance - 1);
    payoutAll();
  }
  
  function getMinBid(uint256 tokenId) public view returns (uint256) {
    uint256 winningBid = winningBids[tokenId];
    uint256 minBid = winningBid * (100 + minRaisePct ) / 100;
    uint256 absMinRaise = minRaiseAbs;
    if (minBid < winningBid + absMinRaise) {
      return winningBid + absMinRaise;
    }
    return minBid;
  }

  function bid(uint256 tokenId, address payoutAddress) external payable nonReentrant {
    require(msg.value >= getMinBid(tokenId), "bid not high enough");
    require(auctionDeadlines[tokenId] >= block.timestamp, "auction not active");
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

    //transfer each token if the auction deadline has passed
    uint256 numTransfers = 0;
    for (uint256 i = 0; i < numTokens; i++) {
      uint256 tokenId = NFTContract.tokenOfOwnerByIndex(address(this), 0);
      if (block.timestamp > auctionDeadlines[tokenId]) {
        NFTContract.transferFrom(address(this), winningPayoutAddresses[tokenId], tokenId);
        numTransfers++;

        //make sure we don't accumulate so many tokens that
        //withdrawals become impossible because they are over the gas limit
        if (numTransfers >= 10) {
          return;
        } 
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
    require(auctionDeadline > block.timestamp + minAuctionDuration, "auction duration too short");
    require(auctionDeadline < block.timestamp + maxAuctionDuration, "auction duration too long");
    uint256 tokenId = NFTContract.createNewArticle(address(this), uri);
    auctionDeadlines[tokenId] = auctionDeadline;
    payoutAll();
  }

}