
const hre = require("hardhat");
const articleNFTAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
const mintControllerAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
const firstEditionNFTAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
const auctionAddress = '0x0165878A594ca255338adfa4d48449f69242Eb8F'
const proxyAdminAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
const minterRole = hre.ethers.zeroPadBytes("0x42042069", 32)
const adminRole = hre.ethers.zeroPadBytes("0x69696969", 32)
const adminAddress = '0x6BafDD3f3122A3188117d2FE4202f85918EC484E'

async function dumpStats() {
  articleNFTFactory = await ethers.getContractFactory("ArticleNFT")
  mintControllerFactory = await ethers.getContractFactory("MintController")
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin")
  firstEditionNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT")
  auctionFactory = await ethers.getContractFactory("Auction")

  const articleNFT = await articleNFTFactory.attach(articleNFTAddress)
  const mintController = await mintControllerFactory.attach(mintControllerAddress)
  const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  const firstEditionNFT = await firstEditionNFTFactory.attach(firstEditionNFTAddress)
  const auction = await auctionFactory.attach(auctionAddress)

  console.log("\n")
  console.log("~~~~~~~~~implementation addresses~~~~~~~~~")
  const articleNFTLogicAddress = await proxyAdmin.getProxyImplementation(articleNFT.target)
  console.log("articleNFT logic address:", articleNFTLogicAddress)
  const firstEditionNFTLogicAddress = await proxyAdmin.getProxyImplementation(firstEditionNFT.target)
  console.log("firstEditionNFT Logic Address:", firstEditionNFTLogicAddress)

  console.log("\n")
  console.log("~~~~~~~~~~~~mintController~~~~~~~~~~~")
  let balance = await hre.ethers.provider.getBalance(mintControllerAddress)
  console.log("balance:", balance)
  const affiliateShareDivisor = await mintController.affiliateShareDivisor()
  console.log("affiliateShareDivisor:", affiliateShareDivisor)
  let benefactor = await mintController.benefactor()
  console.log("benefactor:", benefactor)
  const mintPrice0 = await mintController.mintPrices(0)
  console.log("mintPrice0:", mintPrice0)
  const mintPrice1 = await mintController.mintPrices(1)
  console.log("mintPrice1:", mintPrice1)
  const mintPrice2 = await mintController.mintPrices(2)
  console.log("mintPrice2:", mintPrice2)
  const mintPrice3 = await mintController.mintPrices(3)
  console.log("mintPrice3:", mintPrice3)
  let numAdmins = await mintController.getRoleMemberCount(adminRole)
  let admins = []
  for (let i = 0; i < numAdmins; i++) {
    const admin = await mintController.getRoleMember(adminRole, i)
    admins.push(admin)
  }
  console.log("admins:", admins)

  console.log("\n")
  console.log("~~~~~~~~~~~~~~~~Auction~~~~~~~~~~~~~~")
  balance = await hre.ethers.provider.getBalance(auctionAddress)
  console.log("balance:", balance)
  numAdmins = await auction.getRoleMemberCount(adminRole)
  admins = []
  for (let i = 0; i < numAdmins; i++) {
    const admin = await auction.getRoleMember(adminRole, i)
    admins.push(admin)
  }
  console.log("admins:", admins)
  benefactor = await auction.benefactor()
  console.log("benefactor:", benefactor)
  const auctionDeadline0 = await auction.auctionDeadlines(0)
  console.log("auctionDeadline0:", auctionDeadline0)
  const auctionDeadline1 = await auction.auctionDeadlines(1)
  console.log("auctionDeadline1:", auctionDeadline1)
  const auctionDeadline2 = await auction.auctionDeadlines(2)
  console.log("auctionDeadline2:", auctionDeadline2)
  const auctionDeadline3 = await auction.auctionDeadlines(3)
  console.log("auctionDeadline3:", auctionDeadline3)
  const winningBid0 = await auction.winningBids(0)
  console.log("winningBid0:", winningBid0)
  const winningBid1 = await auction.winningBids(1)
  console.log("winningBid1:", winningBid1)
  const winningBid2 = await auction.winningBids(2)
  console.log("winningBid2:", winningBid2)
  const winningBid3 = await auction.winningBids(3)
  console.log("winningBid3:", winningBid3)
  const winningPayoutAddress0 = await auction.winningPayoutAddresses(0)
  console.log("winningPayoutAddress0:", winningPayoutAddress0)
  const winningPayoutAddress1 = await auction.winningPayoutAddresses(1)
  console.log("winningPayoutAddress1:", winningPayoutAddress1)
  const winningPayoutAddress2 = await auction.winningPayoutAddresses(2)
  console.log("winningPayoutAddress2:", winningPayoutAddress2)
  const winningPayoutAddress3 = await auction.winningPayoutAddresses(3)
  console.log("winningPayoutAddress3:", winningPayoutAddress3)
  let nftBalance = await firstEditionNFT.balanceOf(auctionAddress)
  let allNfts = []
  for (let i = 0; i < nftBalance; i++) {
    const token = await firstEditionNFT.tokenOfOwnerByIndex(auctionAddress, i)
    allNfts.push(token)
  }
  console.log("all NFT Ids:", allNfts)

  console.log("\n")
  console.log("~~~~~~~~~~~~~~~~~~Article NFT~~~~~~~~~~~~~~~~~~")
  numAdmins = await articleNFT.getRoleMemberCount(adminRole)
  admins = []
  for (let i = 0; i < numAdmins; i++) {
    const admin = await articleNFT.getRoleMember(adminRole, i)
    admins.push(admin)
  }
  console.log("admins:", admins)
  numMinters = await articleNFT.getRoleMemberCount(minterRole)
  minters = []
  for (let i = 0; i < numMinters; i++) {
    const minter = await articleNFT.getRoleMember(minterRole, i)
    minters.push(minter)
  }
  console.log("minters:", minters)

  let nextId = await articleNFT.nextId()
  console.log("nextId:", nextId)
  const articleNftEditWindow = await articleNFT.editWindow()
  console.log("editWindow:", articleNftEditWindow)
  const issueAvailability0 = await articleNFT.issueAvailability(0)
  console.log("issueAvailability0:", issueAvailability0)
  const issueAvailability1 = await articleNFT.issueAvailability(1)
  console.log("issueAvailability1:", issueAvailability1)
  const issueAvailability2 = await articleNFT.issueAvailability(2)
  console.log("issueAvailability2:", issueAvailability2)
  const issueAvailability3 = await articleNFT.issueAvailability(3)
  console.log("issueAvailability3:", issueAvailability3)

  for (let i = 0; i < nextId; i++) {
    const adminBalance = await articleNFT.balanceOf(adminAddress, i)
    console.log("admin balance of token", i, ":", adminBalance)
    const uri = await articleNFT.uri(i)
    console.log("uri of token ", i, ":", uri)
  }

  console.log("\n")
  console.log("~~~~~~~~~~~~~~~~First Edition NFT~~~~~~~~~~~~~~")
  numAdmins = await firstEditionNFT.getRoleMemberCount(adminRole)
  admins = []
  for (let i = 0; i < numAdmins; i++) {
    const admin = await firstEditionNFT.getRoleMember(adminRole, i)
    admins.push(admin)
  }
  console.log("admins:", admins)
  numMinters = await firstEditionNFT.getRoleMemberCount(minterRole)
  minters = []
  for (let i = 0; i < numMinters; i++) {
    const minter = await firstEditionNFT.getRoleMember(minterRole, i)
    minters.push(minter)
  }
  console.log("minters:", minters)
  const firstEditionEditWindow = await firstEditionNFT.editWindow()
  console.log("editWindow:", firstEditionEditWindow)
  nextId = await firstEditionNFT.nextId()
  console.log("nextId:", nextId)

  for (let i = 0; i < nextId; i++) {
    const owner = await firstEditionNFT.ownerOf(i)
    console.log("owner of token", i, ":", owner)
    const uri = await firstEditionNFT.tokenURI(i)
    console.log("uri of token ", i, ":", uri)
    const creationTime = await firstEditionNFT.creationTimes(i)
    console.log("creation time of token", i, ":", creationTime)
  }

}

dumpStats().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
