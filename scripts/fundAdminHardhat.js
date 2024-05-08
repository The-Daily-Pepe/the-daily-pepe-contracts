const hre = require("hardhat");


async function main() {
  const adminAddress = '0x6BafDD3f3122A3188117d2FE4202f85918EC484E'
  const [deployer] = await hre.ethers.getSigners()
  // Send 1 ether to an ens name.
const tx = deployer.sendTransaction({
  to: adminAddress,
  value: hre.ethers.parseEther("1.0")
});

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
