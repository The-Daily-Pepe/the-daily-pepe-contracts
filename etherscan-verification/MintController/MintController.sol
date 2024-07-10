// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ArticleNFT.sol";
import "./AccessControl.sol";
import "./Address.sol";
import "./SafeMath.sol";
import "./ReentrancyGuard.sol";

contract MintController is AccessControl, ReentrancyGuard {
  using SafeMath for uint256;

  bytes4 constant ADMIN_ROLE = 0x69696969;
  mapping (uint256 => uint256) public mintPrices;
  ArticleNFT public nftContract;
  address payable public benefactor;
  uint256 public affiliateShareDivisor; //the value of the mint will be divided by this number and the result will be the affiliate payment
  //0 signifies no payment
  //Ex: affiliateShareDivisor = 20. payment is 100. 100 / 20 = 5 (5% affiliate share)

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  constructor(address _nftContract, address _admin, address payable _benefactor, uint256 _affiliateShareDivisor) {
    nftContract = ArticleNFT(_nftContract);
    benefactor = _benefactor;
    affiliateShareDivisor = _affiliateShareDivisor;
    _setupRole(ADMIN_ROLE, _admin);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
  }

  function mint(address destination, uint256 tokenId, uint256 amount) external payable nonReentrant {
    require(msg.value == mintPrices[tokenId].mul(amount), "incorrect_payment");
    nftContract.mint(destination, tokenId, amount);
  }

  function mintAffiliate(address destination, uint256 tokenId, uint256 amount, address payable affiliate) external payable nonReentrant {
    require(msg.value == mintPrices[tokenId].mul(amount), "incorrect_payment");
    nftContract.mint(destination, tokenId, amount);
    if (affiliateShareDivisor != 0) {
      affiliate.transfer(msg.value / affiliateShareDivisor);
    }
  }

  /////////////////////////////////// ADMIN //////////////////////////////////
  
  function setMintPrice(uint256 tokenId, uint256 price) external onlyAdmin {
    mintPrices[tokenId] = price;
  }

  function setAffiliateShareDivisor(uint256 newDivisor) external onlyAdmin {
    affiliateShareDivisor = newDivisor;
  }

  function setBenefactor(address payable newBenefactor) external onlyAdmin {
    //transfer everything to old benefactor first
    withdraw();
    benefactor = newBenefactor;
  }

  function withdraw() public {
    if (address(this).balance != 0) {
      benefactor.transfer(address(this).balance-1);
    }
  }

}