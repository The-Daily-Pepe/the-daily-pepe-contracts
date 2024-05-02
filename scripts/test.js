const hre = require("hardhat");


const proxyAdminAddress = "0x10B64B9c21E3e745c002e5cc81D28F84f406E09b"

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", deployer)
  const proxyAdmin = await proxyAdminFactory.attach(proxyAdminAddress)
  const owner = await proxyAdmin.owner()
  console.log("owner:", owner)
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});