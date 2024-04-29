const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

const MONTH = 2419200n;
const DAY = 86400n

async function main() {
  const benefactorAddress = '0xf47b87217beAC168645790e887CEA643AE180654'
  const adminAddress = '0x9D98e11c3898306adFFEc8297b5e9aE3FbaB76A5'
  const proxyAdminAddress = '0xFE4EC5F069441C2b8f80706DbCC75f7B61f02b01'
  const [deployer] = await hre.ethers.getSigners()
  
  console.log("deployer:", deployer.address)
  articleNFTFactory = await ethers.getContractFactory("ArticleNFT", deployer)
  mintControllerFactory = await ethers.getContractFactory("MintController", deployer)
  proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", deployer)
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  firstEditionArticleNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT", deployer)
  auctionFactory = await ethers.getContractFactory("Auction", deployer)

  //deploy first edition NFT logic
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  firstEditionArticleNFTLogicAddress = getContractAddress({from: deployer.address, nonce: nonce})
  console.log(firstEditionArticleNFTLogicAddress)
  firstEditionArticleNFT = await firstEditionArticleNFTFactory.deploy()

  //deploy proxy for first edition NFT
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  firstEditionProxyAddress = getContractAddress({from: deployer.address, nonce: nonce})
  firstEditionProxy = await proxyFactory.deploy(firstEditionArticleNFTLogicAddress, proxyAdminAddress, "0x")
  firstEditionArticleNFT = await firstEditionArticleNFTFactory.attach(firstEditionProxyAddress)
  //initialize first edition NFT
  await firstEditionArticleNFT.initialize(adminAddress, MONTH, "The Daily Pepe First Edition", "DPEPE")

  //deploy auction for first edition NFT
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  auctionAddress = getContractAddress({from: deployer.address, nonce: nonce})
  await auctionFactory.deploy(
    firstEditionProxyAddress,
    DAY,
    MONTH,
    5,
    ethers.parseEther("0.05"),
    adminAddress,
    benefactorAddress,
  )

  //create auction for first edition NFT
  const auction = await auctionFactory.attach(auctionAddress)
  await auction.createTokenAndStartAuction("QmULn9o1wLWP3yfenTqKiP58hkuR3umY3gGk9cdvbHo5sK", "1716192742")

  console.log("firstEditionArticleNFTLogicAddress:", firstEditionArticleNFTLogicAddress)
  console.log("firstEditionArticleNFTProxyAddress:", firstEditionProxyAddress)
  console.log("auctionAddress:", auction.target)
}





// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});