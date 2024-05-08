// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./ERC1155.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";

contract ArticleNFT is ERC1155, AccessControl {
  event NewTokenID(uint256 indexed tokenID, string uri);

  struct TimeRange {
    uint256 start;
    uint256 end;
  }

  bytes4 private constant ADMIN_ROLE = 0x69696969;
  bytes4 private constant MINTER_ROLE = 0x42042069;
  mapping (uint256 => TimeRange) public issueAvailability;
  uint256 public nextId = 0;
  uint256 public editWindow; //the duration for which a token's URI can be edited after it is deployed
  bool private initialized = false;

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  modifier onlyMinter {
    require(hasRole(MINTER_ROLE, msg.sender), "only_minter");
    _;
  }

  function canIssue(uint256 articleId) public view returns (bool) {
    TimeRange memory issueRange = issueAvailability[articleId];
    return !(issueRange.start > block.timestamp || block.timestamp > issueRange.end);
  }

  function initialize(address admin, address minter, uint256 _editWindow) public {
    require(!initialized, "no_re-init");
    initialized = true;
    //~ERC1155 constructor~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _registerInterface(0xd9b67a26);//ERC1155 standard interface
    _registerInterface(0x0e89341c);//metadata uri interface
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ERC1155 constructor~
    _setupRole(ADMIN_ROLE, admin);
    _setupRole(MINTER_ROLE, admin); //admin can also mint
    _setupRole(MINTER_ROLE, minter);
    _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
    _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    editWindow =_editWindow;
  }

  function setURI(uint256 tokenID, string memory newuri) public onlyAdmin {
    require(issueAvailability[tokenID].start + editWindow >= block.timestamp, "cannot edit URI past edit window");
    _setURI(tokenID, newuri);
  }

  function createNewArticle(uint256 issueStart, uint256 issueEnd, string memory uri) public onlyAdmin {
    require(issueEnd > issueStart, "invalid_availability_duration");
    uint256 _nextId = nextId;
    issueAvailability[_nextId].start = issueStart;
    issueAvailability[_nextId].end = issueEnd;
    _setURI(_nextId, uri);
    emit NewTokenID(_nextId, uri);
    nextId++;
  }

  function mint(address account, uint256 articleId, uint256 amount) public onlyMinter {
    require(canIssue(articleId), "article_unavailable");
    _mint(account, articleId, amount);
  }
}