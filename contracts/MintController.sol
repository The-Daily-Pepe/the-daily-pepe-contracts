// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ArticleNFT.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract MintController is AccessControl {
  using SafeMath for uint256;
  using Address for address;

  bytes4 constant ADMIN_ROLE = 0x69696969;
  mapping (uint256 => uint256) public mintPrices;
  ArticleNFT public nftContract;
  address payable private benefactor;

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  constructor(address _nftContract, address _admin, address payable _benefactor) {
    nftContract = ArticleNFT(_nftContract);
    benefactor = _benefactor;
    _setupRole(ADMIN_ROLE, _admin);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
  }

  function mint(address destination, uint256 tokenId, uint256 amount) public payable {
    require(msg.value == mintPrices[tokenId].mul(amount), "incorrect_payment");
    nftContract.mint(destination, tokenId, amount);
  }

  /////////////////////////////////// ADMIN //////////////////////////////////
  
  function setMintPrice(uint256 tokenId, uint256 price) public onlyAdmin {
    mintPrices[tokenId] = price;
  }

  function setBenefactor(address payable newBenefactor) public onlyAdmin {
    //transfer everything to old benefactor first
    withdraw();
    benefactor = newBenefactor;
  }

  function withdraw() public {
    benefactor.transfer(address(this).balance - 1);
  }

}