const hre = require("hardhat");

async function main() {
  const sepoliaProvider = new hre.ethers.JsonRpcProvider('https://sepolia.drpc.org')
  const benefactorAddress = '0xf47b87217beAC168645790e887CEA643AE180654'
  const adminAddress = '0xC104f6c677e0745DA99F8EF6b081e9Fa9c546F79'
  const admin = new hre.ethers.Wallet(/*Key is redacted, you will have to dig it up based on the adminAddress*/"" , sepoliaProvider)
  articleNFTFactory = await ethers.getContractFactory("ArticleNFT", admin)
  mintControllerFactory = await ethers.getContractFactory("MintController", admin)
  proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", admin)
  proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", admin)

  // proxyAdmin = await proxyAdminFactory.deploy()//0xFE4EC5F069441C2b8f80706DbCC75f7B61f02b01
  const proxyAdminAddress = '0xFE4EC5F069441C2b8f80706DbCC75f7B61f02b01'
  const proxyAdmin = proxyAdminFactory.attach(proxyAdminAddress)
  // articleNFT = await articleNFTFactory.deploy()//0xac554F6Af1d32abEdcc7C2e6Ec3C7E699218Afc3
  const articleNFTLogicAddress = '0xac554F6Af1d32abEdcc7C2e6Ec3C7E699218Afc3'
  // const articleNFT = articleNFTFactory.attach(articleNFTAddress)
  // proxyImplementation = articleNFT.target
  // proxy = await proxyFactory.deploy(articleNFTLogicAddress, proxyAdminAddress, "0x")//0xF21D518cB523a824E7FF8eE4787D20558375BBb1
  const proxyAddress = '0xF21D518cB523a824E7FF8eE4787D20558375BBb1'
  const proxy = proxyFactory.attach(proxyAddress)
  // mintController = await mintControllerFactory.deploy(proxy.target, admin, benefactorAddress, 20)//0x04254954e09A0805401B7827C013ceaE47fB7de4
  const mintControllerAddress = '0x04254954e09A0805401B7827C013ceaE47fB7de4'
  const mintController = mintControllerFactory.attach(mintControllerAddress)
  articleNFT = await articleNFTFactory.attach(proxy.target)
  await articleNFT.initialize(admin, mintController, 1000)

  //create some articles
  await mintController.setMintPrice(0, hre.ethers.parseEther("0.001"))
  await mintController.setMintPrice(1, 69420n)
  await mintController.setMintPrice(2, 42069n)
  await mintController.setMintPrice(3, hre.ethers.parseEther("0.001"))

  //no longer mintable
  await articleNFT.createNewIssue(1, 1000, "ipfs://QmRbcjLvdvkspS9xesbY1Zehw5b7fiFa4yzmpchQvsZcLe")
  //mintable right now and forever
  await articleNFT.createNewIssue(1000, "99999999999999999999999999999999999999999999", "ipfs://Qmcbkg2VtkuTZGHU2idxoP3QKUHLwnvy67qvqcifSwc5dT")

  //mintable in 20 seconds for one minute
  const block = await hre.ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  console.log("block")
  console.log("bt", block.timestamp)
  await articleNFT.createNewIssue(block.timestamp+20, block.timestamp+80, "ipfs://QmSi6fehR8cqEEuA7WG58dqN91ttqQ9GN35SxEJBKgN7Ss")
  const numArticles = await articleNFT.nextIssue()
  console.log("numArticles", numArticles)

  //mintable forever
  await articleNFT.createNewIssue(1000, "99999999999999999999999999999999999999999999", "ipfs://QmZWcii6aiCsV2pNupnYhTxJPeeNNPims5GrQcPWYQy73P")


  console.log("---------------deployment addresses---------------")
  console.log("articleNFTLogic:", proxyImplementation)
  console.log("proxyAdmin:", proxyAdmin.target)
  console.log("admin account:", admin.address)
  console.log("mintController:", mintController.target)
  console.log("proxy (articleNFT):", articleNFT.target, proxy.target)
  console.log("benefactor account:", benefactorAddress)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
