const MONTH = 2419200n;
const DAY = 86400n;
const firstEditionNFTProxyAddress = '0x4cFb412612714c90580A4B46EA629DF517C34af0';
const adminAddress = '0x9D98e11c3898306adFFEc8297b5e9aE3FbaB76A5';
const benefactorAddress = '0xf47b87217beAC168645790e887CEA643AE180654';

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  auctionFactory = await ethers.getContractFactory("Auction", deployer)

  console.log("deployer:", deployer.address)
  await auctionFactory.deploy(
    firstEditionNFTProxyAddress,
    DAY, //minimum auction duration
    MONTH, //maximum auction duration
    5, //5% minimum raise
    ethers.parseEther("0.05"), //0.05 eth absolute minimum raise
    adminAddress,
    benefactorAddress,
  )
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});