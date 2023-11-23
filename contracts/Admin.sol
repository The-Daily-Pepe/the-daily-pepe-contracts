// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "openzeppelin-solidity/contracts/proxy/ProxyAdmin.sol";

contract Admin {
  mapping(address => bool) public backupAdmins;
  address public admin;
  address public proxyAdmin;
  uint256 public reclaimDelay; //the delay for a backup admin to claim the admin role, in seconds
  uint256 public reclaimStart;
  bool public activeReclaim; //is there an active claim on admin by a backup admin?
  address public reclaimant; //the backup admin that started the claim

  //prime contract for dangerous action
  uint256 public primingDelay; //how long do we have to wait between priming and making a dangerous action
  bool public primeInitialized; //this contract has started being primed for a dangerous action
  uint256 public primeTimestamp; //when did the priming being?

  modifier onlyAdmin {
    require(msg.sender == admin, "only admin");
    _;
  }

  modifier dangerPrimed {
    require(primeInitialized, "dangerous actions must be primed");
    require(primeTimestamp + primingDelay > block.timestamp, "dangerous action priming not mature");
    _;
  }

  event ReclaimStarted(address reclaimant);

  event DangerPrimed();

  constructor(
    address _admin,
    uint256 _reclaimDelay,
    uint256 _primingDelay
    ) {
    admin = _admin;
    reclaimDelay = _reclaimDelay;
    primingDelay = _primingDelay;
  }

  function changeAdmin(address newAdmin) public onlyAdmin dangerPrimed {
    admin = newAdmin;
  }

  function addBackupAdmin(address backupAdmin) public onlyAdmin {
    backupAdmins[backupAdmin] = true;
  }

  function startReclaim() public {
    require(backupAdmins[msg.sender], "only backup admin can reclaim");
    require(!activeReclaim, "there is already an active reclaim");
    activeReclaim = true;
    reclaimStart = block.timestamp;
    reclaimant = msg.sender;
    emit ReclaimStarted(reclaimant);
  }

  function cancelReclaim() public {
    require(activeReclaim, "no active reclaim");
    require(msg.sender == reclaimant || msg.sender == admin, "only active reclaimant or admin can canel");
    activeReclaim = false;
    reclaimStart = 0;
    reclaimant = address(0);
  }

  function finalizeReclaim() public {
    require(activeReclaim, "no reclaim active");
    require(reclaimStart + reclaimDelay > block.timestamp, "reclaim delay not satisfied");
    require(msg.sender == reclaimant, "only reclaimant can finalize reclaim");
    activeReclaim = false;
    reclaimStart = 0;
    reclaimant = address(0);
    admin = msg.sender;
  }

  // //changes the admin of the 
  // function changeProxyAdmin() public {

  // }
}