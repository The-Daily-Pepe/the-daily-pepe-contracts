const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

const MONTH = 2419200n;
const DAY = 86400n

async function main() {
  const benefactorAddress = '0xf47b87217beAC168645790e887CEA643AE180654'
  const adminAddress = '0x9D98e11c3898306adFFEc8297b5e9aE3FbaB76A5'
  const [deployer] = await hre.ethers.getSigners()

  console.log("deployer:", deployer.address)
  console.log("admin:", adminAddress)
  console.log("benefactor:", benefactorAddress)

  articleNFTFactory = await ethers.getContractFactory("ArticleNFT", deployer)
  mintControllerFactory = await ethers.getContractFactory("MintController", deployer)
  proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", deployer)
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  firstEditionNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT", deployer)
  auctionFactory = await ethers.getContractFactory("Auction", deployer)

  //~~~deployments~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  //articleNFT logic
  let nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const articleNFTLogicAddress = getContractAddress({from: deployer.address, nonce})
  console.log("articleNFTLogic:", articleNFTLogicAddress)
  await articleNFTFactory.deploy()

  await sleep(20000)//20 seconds

  //firstEditionNFT logic
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const firstEditionNFTLogicAddress = getContractAddress({from: deployer.address, nonce})
  console.log("firstEditionNFTLogic:", firstEditionNFTLogicAddress)
  await firstEditionNFTFactory.deploy()

  await sleep(20000)//20 seconds

  //proxyAdmin
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const proxyAdminAddress = getContractAddress({from: deployer.address, nonce})
  await proxyAdminFactory.deploy()
  console.log("proxyAdmin:", proxyAdminAddress)

  await sleep(20000)//20 seconds

  //articleNFT proxy
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const articleNFTProxyAddress = getContractAddress({from: deployer.address, nonce})
  await proxyFactory.deploy(articleNFTLogicAddress, proxyAdminAddress, "0x")
  console.log("articleNFT proxy:", articleNFTProxyAddress)

  await sleep(20000)//20 seconds

  //firstEditionNFT proxy
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const firstEditionNFTProxyAddress = getContractAddress({from: deployer.address, nonce})
  await proxyFactory.deploy(firstEditionNFTLogicAddress, proxyAdminAddress, "0x")
  console.log("firstEditionNFT proxy:", firstEditionNFTProxyAddress)

  await sleep(20000)//20 seconds

  //mintController (normal articleNFT)
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const mintControllerAddress = getContractAddress({from: deployer.address, nonce})
  await mintControllerFactory.deploy(
    articleNFTProxyAddress,
    adminAddress,
    benefactorAddress,
    10, //1/10 of mint revenue goes to affiliate
  )
  console.log("mintController:", mintControllerAddress)

  await sleep(20000)//20 seconds

  //auction (first edition articleNFT)
  nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
  const auctionAddress = getContractAddress({from: deployer.address, nonce})
  console.log("auction:", auctionAddress)
  await auctionFactory.deploy(
    firstEditionNFTProxyAddress,
    DAY, //minimum auction duration
    MONTH, //maximum auction duration
    5, //5% minimum raise
    ethers.parseEther("0.025"), //0.025 eth absolute minimum raise
    adminAddress,
    benefactorAddress,
  )

  await sleep(20000)//20 seconds
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~deployments~~~

  //let one block pass so script doesn't shit itself
  console.log("done deploying, running setup...")

  //~~~setup~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  //set admin as owner of proxyAdmin
  const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  await proxyAdmin.transferOwnership(adminAddress)
  await sleep(20000)//20 seconds


  const newProxyAdminAdmin = await proxyAdmin.owner()
  console.log("newProxyAdminAdmin:", newProxyAdminAdmin)

  const articleNFT = await articleNFTFactory.attach(articleNFTProxyAddress)
  const firstEditionArticleNFT = await firstEditionNFTFactory.attach(firstEditionNFTProxyAddress)

  //initialize articleNFT
  await articleNFT.initialize(adminAddress, mintControllerAddress, MONTH)

  //initialize firstEditionNFT
  await firstEditionArticleNFT.initialize(adminAddress, auctionAddress, MONTH, "The Daily Pepe First Edition", "DPEPE")

  console.log("done")

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~setup~~~
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
