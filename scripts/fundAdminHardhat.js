const hre = require("hardhat");


async function main() {
  const adminAddress = '0x2cfC3d91315372F4ce92D1b536811a834B1270F1'
  const [deployer] = await hre.ethers.getSigners()
  // Send 1 ether to an ens name.
const tx = deployer.sendTransaction({
  to: adminAddress,
  value: hre.ethers.parseEther("0.128")
});

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
