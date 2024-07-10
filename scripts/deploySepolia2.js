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

  const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  await proxyAdmin.transferOwnership(adminAddress)
  console.log("done")
  process.exit()
  //deploy first edition NFT logic
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  console.log("nonce:", nonce)
  firstEditionArticleNFTLogicAddress = '0xC8202ff2CEb10E5F589ac240357beD2A9c10454e'//getContractAddress({from: deployer.address, nonce: nonce})
  console.log(firstEditionArticleNFTLogicAddress)
  // firstEditionArticleNFT = await firstEditionArticleNFTFactory.deploy()
  console.log("deployed firstEditionArticleNFT logic:", firstEditionArticleNFTLogicAddress)
  //deploy proxy for first edition NFT
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  console.log("nonce:", nonce)
  firstEditionProxyAddress = '0x51044E848d7926e09CFfd5197d471a3F599c8943'//getContractAddress({from: deployer.address, nonce: nonce})
  console.log("firstEditionNFTProxy:", firstEditionProxyAddress)
  // firstEditionProxy = await proxyFactory.deploy(firstEditionArticleNFTLogicAddress, proxyAdminAddress, "0x")
  firstEditionArticleNFT = await firstEditionArticleNFTFactory.attach(firstEditionProxyAddress)
  

  //deploy auction for first edition NFT
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  console.log("nonce:", nonce)
  auctionAddress = '0x837c4c5f585004699Ffae8C33D6bD92474606EB7'//getContractAddress({from: deployer.address, nonce: nonce})

  //initialize first edition NFT
  console.log("nig")
  // await firstEditionArticleNFT.initialize(adminAddress, auctionAddress, MONTH, "The Daily Pepe First Edition", "DPEPE")
  console.log("nig")

  // await auctionFactory.deploy(
  //   firstEditionProxyAddress,
  //   DAY,
  //   MONTH,
  //   5,
  //   ethers.parseEther("0.05"),
  //   adminAddress,
  //   benefactorAddress,
  // )

  //create auction for first edition NFT
  const auction = await auctionFactory.attach(auctionAddress)
  console.log("auctionAddress:", auctionAddress)

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