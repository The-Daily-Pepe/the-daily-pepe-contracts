// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";

contract FirstEditionArticleNFT is ERC721, AccessControl {
  event NewTokenID(uint256 indexed tokenID, string uri);

  bytes4 private constant ADMIN_ROLE = 0x69696969;
  uint256 public nextId = 0;
  mapping (uint256 => uint256) creationTimes; //maps tokenID to the block timestamp when it was created
  uint256 public editWindow; //the duration for which a token's URI can be edited after it is deployed
  bool public initialized = false;

  constructor() ERC721("The Daily Pepe First Edition", "TDP1") {}

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  function initialize(address admin, uint256 _editWindow) public {
    require(!initialized, "no_re-init");
    initialized = true;
    //~ERC1155 constructor~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _registerInterface(0xd9b67a26);//ERC1155 standard interface
    _registerInterface(0x0e89341c);//metadata uri interface
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ERC1155 constructor~
    _setupRole(ADMIN_ROLE, admin);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
    editWindow =_editWindow;
  }

  function setURI(uint256 tokenID, string memory newuri) public onlyAdmin {
    require(creationTimes[tokenID] + editWindow >= block.timestamp, "cannot edit URI past edit window");
    _setTokenURI(tokenID, newuri);
  }

  function createNewArticle(address recipient, string memory uri) public onlyAdmin {
    uint256 _nextId = nextId;
    creationTimes[_nextId] = block.timestamp;
    _safeMint(recipient, _nextId);
    _setTokenURI(_nextId, uri);
    nextId++;
  }
}