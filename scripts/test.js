const hre = require("hardhat");


const proxyAdminAddress = "0x10B64B9c21E3e745c002e5cc81D28F84f406E09b"
const adminAddress = ""
const mintControllerAddress = ""

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log("deployer", deployer.address)
  // proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  // const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  // const owner = await proxyAdmin.owner()
  // console.log("owner:", owner)

    //initialize articleNFT
    await articleNFT.initialize(adminAddress, mintControllerAddress, MONTH)

    //initialize firstEditionNFT
    await firstEditionArticleNFT.initialize(adminAddress, MONTH, "The Daily Pepe First Edition", "DPEPE")
  
    console.log("done")
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});