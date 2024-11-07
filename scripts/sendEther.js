const hre = require("hardhat");
const { parseEther } = require("viem");

const DPAdmin = '0x9D98e11c3898306adFFEc8297b5e9aE3FbaB76A5'
const ISA = '0xcD2E393c380a901975382C703af110BFFb7DE340'
const deployer = '0x2cfC3d91315372F4ce92D1b536811a834B1270F1'

async function main() {
  const recipient = ISA
  const [deployer] = await hre.ethers.getSigners()
  // Send 1 ether to an ens name.
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  const value = balance - parseEther("0.000003")
const tx = deployer.sendTransaction({
  to: recipient,
  value
});

console.log("tx:", (await tx).hash)

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
