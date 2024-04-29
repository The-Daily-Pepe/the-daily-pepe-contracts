// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

const MONTH = 2419200n;
const DAY = 86400n

async function main() {
  [admin, unpriviledged0, unpriviledged1, benefactor, deployer] = await ethers.getSigners()
  articleNFTFactory = await ethers.getContractFactory("ArticleNFT", deployer)
  mintControllerFactory = await ethers.getContractFactory("MintController", deployer)
  proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", deployer)
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  firstEditionArticleNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT", deployer)
  auctionFactory = await ethers.getContractFactory("Auction", deployer)

  proxyAdmin = await proxyAdminFactory.deploy()
  articleNFT = await articleNFTFactory.deploy()
  proxyImplementation = articleNFT.target
  proxy = await proxyFactory.deploy(articleNFT.target, proxyAdmin, "0x")
  mintController = await mintControllerFactory.deploy(proxy.target, admin, benefactor, 20)
  articleNFT = await articleNFTFactory.attach(proxy.target)
  firstEditionArticleNFT = await firstEditionArticleNFTFactory.deploy()
  firstEditionProxy = await proxyFactory.deploy(firstEditionArticleNFT.target, proxyAdmin, "0x")
  firstEditionArticleNFT = await firstEditionArticleNFTFactory.attach(firstEditionProxy.target)
  await firstEditionArticleNFT.initialize(admin.address, MONTH, "The Daily Pepe First Edition", "DPEPE")
  auction = await auctionFactory.deploy(
    firstEditionArticleNFT.target,
    DAY,
    MONTH,
    5,
    ethers.parseEther("0.05"),
    admin.address,
    benefactor.address,
  )
  await articleNFT.initialize(admin, mintController, 1000)

  //create some articles
  await mintController.connect(admin).setMintPrice(0, hre.ethers.parseEther("0.001"))
  await mintController.connect(admin).setMintPrice(1, 69420n)
  await mintController.connect(admin).setMintPrice(2, 42069n)
  await mintController.connect(admin).setMintPrice(3, hre.ethers.parseEther("0.001"))

  //no longer mintable
  await articleNFT.connect(admin).createNewArticle(1, 1000, "ipfs://QmRbcjLvdvkspS9xesbY1Zehw5b7fiFa4yzmpchQvsZcLe")
  //mintable right now and forever
  await articleNFT.connect(admin).createNewArticle(1000, "99999999999999999999999999999999999999999999", "ipfs://Qmcbkg2VtkuTZGHU2idxoP3QKUHLwnvy67qvqcifSwc5dT")

  //mintable in 20 seconds for one minute
  const block = await hre.ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  console.log("block")
  console.log("bt", block.timestamp)
  await articleNFT.connect(admin).createNewArticle(block.timestamp+20, block.timestamp+80, "ipfs://QmSi6fehR8cqEEuA7WG58dqN91ttqQ9GN35SxEJBKgN7Ss")
  const numArticles = await articleNFT.nextId()
  console.log("numArticles", numArticles)

  //mintable forever
  await articleNFT.connect(admin).createNewArticle(1000, "99999999999999999999999999999999999999999999", "ipfs://QmZWcii6aiCsV2pNupnYhTxJPeeNNPims5GrQcPWYQy73P")
  
  //mint some articles
  await articleNFT.connect(admin).mint(unpriviledged0.address, 1, 5)
  await articleNFT.connect(admin).mint(unpriviledged0.address, 3, 3)
  await articleNFT.connect(admin).mint(unpriviledged1.address, 1, 1)


  console.log("---------------deployment addresses---------------")
  console.log("articleNFTLogic:", proxyImplementation)
  console.log("proxyAdmin:", proxyAdmin.target)
  console.log("admin account:", admin.address)
  console.log("mintController:", mintController.target)
  console.log("proxy (articleNFT):", articleNFT.target, proxy.target)
  console.log("user account0:", unpriviledged0.address)
  console.log("user account1:", unpriviledged1.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
