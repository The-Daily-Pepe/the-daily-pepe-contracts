describe("everything working together", () => {
  beforeEach(async () => {
    [admin, unpriviledged0, unpriviledged1, benefactor] = await ethers.getSigners()
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT", admin)
    mintControllerFactory = await ethers.getContractFactory("MintController", admin)
    proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", admin)
    proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", admin)

    proxyAdmin = await proxyAdminFactory.deploy()
    articleNFT = await articleNFTFactory.deploy()
    proxy = await proxyFactory.deploy(articleNFT.target, proxyAdmin, "0x")
    mintController = await mintControllerFactory.deploy(proxy.target, admin, benefactor, 20)
    articleNFT = await articleNFTFactory.attach(proxy.target)
    await articleNFT.initialize(admin, mintController, 1000)
  })
})