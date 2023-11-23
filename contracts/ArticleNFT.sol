// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./ERC1155.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";


contract ArticleNFT is ERC1155, AccessControl {
  using Address for address;

  event NewTokenID(uint256 indexed tokenID, string uri);

  struct TimeRange {
    uint256 start;
    uint256 end;
  }

  bytes4 private constant ADMIN_ROLE = 0x69696969;
  bytes4 private constant MINTER_ROLE = 0x42042069;
  mapping (uint256 => TimeRange) public IssueAvailability;
  uint256 public nextIssue = 0;
  uint256 public editWindow; //the duration for which a token's URI can be edited after it is deployed
  bool public initialized = false;

  modifier onlyAdmin {
    require(hasRole(ADMIN_ROLE, msg.sender), "only_admin");
    _;
  }

  modifier onlyMinter {
    require(hasRole(MINTER_ROLE, msg.sender), "only_minter");
    _;
  }

  function canIssue(uint256 articleId) public view returns (bool) {
    TimeRange memory issueRange = IssueAvailability[articleId];
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
    require(IssueAvailability[tokenID].start + editWindow >= block.timestamp, "cannot edit URI past edit window");
    _setURI(tokenID, newuri);
  }

  function createNewIssue(uint256 issueStart, uint256 issueEnd, string memory uri) public onlyAdmin {
    require(issueEnd > issueStart, "invalid_availability_duration");

    IssueAvailability[nextIssue].start = issueStart;
    IssueAvailability[nextIssue].end = issueEnd;
    _setURI(nextIssue, uri);
    emit NewTokenID(nextIssue, uri);
    nextIssue++;
  }

  function mint(address account, uint256 articleId, uint256 amount) public onlyMinter {
    require(canIssue(articleId), "article_unavailable");
    _mint(account, articleId, amount);
  }

}