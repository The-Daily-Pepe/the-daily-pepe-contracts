const hre = require("hardhat");


const proxyAdminAddress = "0x10B64B9c21E3e745c002e5cc81D28F84f406E09b"
const adminAddress = ""
const mintControllerAddress = ""

// articleNFT logic 0x4e4a9B940934b4F41F2B716b7D2D803D40A21912
// firstEditionArticleNFT logic 0x4EA44064738468Cb5DE5a5af175eb8398f913883

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log("deployer", deployer.address)
  // proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  // const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  // const owner = await proxyAdmin.owner()
  // console.log("owner:", owner)

    //initialize articleNFT
    // await articleNFT.initialize(adminAddress, mintControllerAddress, MONTH)

    //initialize firstEditionNFT
    // await firstEditionArticleNFT.initialize(adminAddress, MONTH, "The Daily Pepe First Edition", "DPEPE")
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT", deployer)
    firstEditionArticleNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT", deployer)
    const articleNFT = await articleNFTFactory.deploy()
    await sleep(10000)
    const firstEditionNFT = await firstEditionArticleNFTFactory.deploy()
    await sleep(10000)
    console.log("articleNFT", articleNFT.target)
    console.log("firstEditionArticleNFT", firstEditionNFT.target)
    console.log("done")
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