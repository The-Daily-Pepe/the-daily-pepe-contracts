const { expect } = require("chai")
const { ethers } = require("hardhat")


describe("transparent upgradeable proxy with proxy admin is configured correctly", () => {
  let admin, unpriviledged0, unpriviledged1, benefactor, mintController, articleNFT, proxy, proxyAdmin, proxyImplementation, articleNFTFactory
  beforeEach(async () => {
    [admin, unpriviledged0, unpriviledged1, benefactor] = await ethers.getSigners()
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT", admin)
    mintControllerFactory = await ethers.getContractFactory("MintController", admin)
    proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", admin)
    proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", admin)

    proxyAdmin = await proxyAdminFactory.deploy()
    articleNFT = await articleNFTFactory.deploy()
    proxyImplementation = articleNFT.target
    proxy = await proxyFactory.deploy(articleNFT.target, proxyAdmin, "0x")
    mintController = await mintControllerFactory.deploy(proxy.target, admin, benefactor, 20)
    articleNFT = await articleNFTFactory.attach(proxy.target)
    await articleNFT.initialize(admin, mintController, 1000)
  })

  it("proxy should disallow admin calls from anyone other than the admin", async () => {
    await expect(
      proxy.admin()
    ).to.be.revertedWithoutReason()

    await expect(
      proxy.implementation()
    ).to.be.revertedWithoutReason()

    await expect(
      proxy.changeAdmin(unpriviledged0)
    ).to.be.revertedWithoutReason()

    await expect(
      proxy.upgradeTo(await articleNFTFactory.deploy())
    ).to.be.revertedWithoutReason()

    await expect(
      proxy.upgradeToAndCall(await articleNFTFactory.deploy(), "0x")
    ).to.be.revertedWithoutReason()
  })

  it("proxyAdmin should be able to call admin functions", async () => {
    expect(
      await proxyAdmin.getProxyAdmin(proxy)
    ).to.equal(proxyAdmin.target)

    expect(
      await proxyAdmin.getProxyImplementation(proxy)
    ).to.equal(proxyImplementation)
  })

  it("should be able to update the implementation", async () => {
    newImplementation = await articleNFTFactory.deploy()
    expect(
      await proxyAdmin.getProxyImplementation(proxy)
    ).not.to.equal(newImplementation.target)

    await proxyAdmin.upgrade(proxy, newImplementation)

    expect(
      await proxyAdmin.getProxyImplementation(proxy)
    ).to.equal(newImplementation.target)
  })

  it("should be able to update the admin", async () => {
    await expect(
      proxy.connect(unpriviledged0).admin()
    ).to.be.revertedWithoutReason()

    await expect(
      proxyAdmin.getProxyAdmin(proxy)
    ).not.to.be.revertedWithoutReason()

    await proxyAdmin.changeProxyAdmin(proxy, unpriviledged0)

    await expect(
      proxy.connect(unpriviledged0).admin()
    ).not.to.be.revertedWithoutReason()

    await expect(
      proxyAdmin.getProxyAdmin(proxy)
    ).to.be.revertedWithoutReason()
  })

  it("should be able to change the admin of the proxy admin", async () => {
    await proxyAdmin.transferOwnership(unpriviledged0)
    expect(
      await proxyAdmin.owner()
    ).to.equal(unpriviledged0.address)
  })
})

const minterRole = ethers.zeroPadBytes("0x42042069", 32)
const adminRole = ethers.zeroPadBytes("0x69696969", 32)

describe("upgradeable proxy with proxy admin - ArticleNFT functionality", () => {
  let admin, unpriviledged0, unpriviledged1, benefactor, minter, articleNFT, proxy, proxyAdmin
  beforeEach(async () => {
    [admin, unpriviledged0, unpriviledged1, benefactor, minter] = await ethers.getSigners()
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT", admin)
    proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", admin)
    proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", admin)

    proxyAdmin = await proxyAdminFactory.deploy()
    articleNFT = await articleNFTFactory.deploy()
    proxy = await proxyFactory.deploy(articleNFT.target, proxyAdmin, "0x")
    articleNFT = await articleNFTFactory.attach(proxy.target)
    await articleNFT.initialize(admin, minter, 1000)
  })

  it("should not be able to call initialize multiple times", async () => {
    await expect(
      articleNFT.initialize(admin, minter, "1000")
    ).to.be.revertedWith("no_re-init")
  })

  it("should implement the ERC1155 interfaces", async () => {
    const ERC1155StandardInterface = "0xd9b67a26"
    const metadataURIInterface = "0x0e89341c"

    expect(
      await articleNFT.supportsInterface(ERC1155StandardInterface)
    ).to.equal(true)

    expect(
      await articleNFT.supportsInterface(metadataURIInterface)
    ).to.equal(true)
  })

  it("setApprovalForAll and isApprovedForAll", async () => {
    let owner = unpriviledged0.address
    let operator = unpriviledged1.address
    //already false
    expect(await articleNFT.isApprovedForAll(owner, operator)).to.equal(false)
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, false)
    expect(await articleNFT.connect(unpriviledged0).isApprovedForAll(owner, operator)).to.equal(false)

    //false to true
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, true)
    expect(await articleNFT.connect(unpriviledged0).isApprovedForAll(owner, operator)).to.equal(true)

    //true to true
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, true)
    expect(await articleNFT.connect(unpriviledged0).isApprovedForAll(owner, operator)).to.equal(true)

    //true to false
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, false)
    expect(await articleNFT.connect(unpriviledged0).isApprovedForAll(owner, operator)).to.equal(false)
  })

  it("createNewArticle() from unpriviledged account", async () => {
    await expect(
      articleNFT.connect(unpriviledged0).createNewArticle(0, 1, "0")
    ).to.be.revertedWith("only_admin")
  })

  it("createNewArticle() from priviledged account", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    expect(
      await articleNFT.uri(0)
    ).to.equal("uri0")

    expect(
      await articleNFT.canIssue(0)
    ).to.equal(true)
  })

  it("mint() from non-admin", async () => {
    await expect(
      articleNFT.connect(unpriviledged0).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("only_minter");
  })

  it("mint() from admin for expired article", async () => {
    await articleNFT.connect(admin).createNewArticle(0, 1, "uri0")
    await expect(
      articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("article_unavailable")
  })

  it("mint() from non-existant article", async () => {
    await expect(
      articleNFT.connect(minter).mint(unpriviledged0.address, 1, 1)
    ).to.be.revertedWith("article_unavailable")
  })

  it("mint() from admin for fresh article", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    //mint from minter
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    expect(
      await articleNFT.balanceOf(unpriviledged0.address, 0)
    ).to.equal("1")

    //admin can also mint
    await articleNFT.connect(admin).mint(unpriviledged0.address, 0, 2)
    expect(
      await articleNFT.balanceOf(unpriviledged0.address, 0)
    ).to.equal("3")
  })

  it("mint() from non-admin", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")

    await expect(
      articleNFT.connect(unpriviledged0).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("only_minter")
  })

  it("safeTransferFrom() owner's account without permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)

    await articleNFT.connect(unpriviledged0).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
  })

  it("safeTransferFrom() another account without permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)

    await expect(
      articleNFT.connect(unpriviledged1).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    ).to.be.revertedWith("Need operator approval for 3rd party transfers.")
  })

  it("safeTransferFrom() another account with permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, true)

    await articleNFT.connect(unpriviledged1).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
  })

  it("safeBatchTransferFrom() owner's account without permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(1, "99999999999999999999999999999999999999999999", "uri1")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(minter).mint(unpriviledged0.address, 1, 2)

    await articleNFT.connect(unpriviledged0).safeBatchTransferFrom(unpriviledged0.address, unpriviledged1.address, [0, 1], [1, 2], '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 1)
    ).to.equal("2")
  })

  it("safeBatchTransferFrom() another account without permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(1, "99999999999999999999999999999999999999999999", "uri1")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(minter).mint(unpriviledged0.address, 1, 2)

    await expect(
      articleNFT.connect(unpriviledged1).safeBatchTransferFrom(unpriviledged0.address, unpriviledged1.address, [0, 1], [1, 2], '0x00')
    ).to.be.revertedWith("Need operator approval for 3rd party transfers.")
  })

  it("safeBatchTransferFrom() another account with permission", async () => {
    await articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(1, "99999999999999999999999999999999999999999999", "uri1")
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(minter).mint(unpriviledged0.address, 1, 2)
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, true)

    await articleNFT.connect(unpriviledged1).safeBatchTransferFrom(unpriviledged0.address, unpriviledged1.address, [0, 1], [1, 2], '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 1)
    ).to.equal("2")
  })

  it("setURI() from admin account", async () => {
    //within edit window
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).setURI(0, "newURI0")
    expect(
      await articleNFT.uri(0)
    ).to.equal("newURI0")

    //outside edit window
    await articleNFT.connect(admin).createNewArticle(block.timestamp - 1001, "99999999999999999999999999999999999999999999", "uri0")
    await expect(
      articleNFT.connect(admin).setURI(1, "newURI1")
    ).to.be.revertedWith("cannot edit URI past edit window")
  })

  it("setURI() from unpriviledged account", async () => {
    await expect(
      articleNFT.connect(minter).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    ).to.be.revertedWith("only_admin")
  })

  const minterRole = ethers.zeroPadBytes("0x42042069", 32)
  const adminRole = ethers.zeroPadBytes("0x69696969", 32)
  it("should be able to revoke the minter role", async () => {
    await articleNFT.connect(admin).revokeRole(minterRole, minter)
    //minter should now not be able to call priviledged functions
    await expect(
      articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("only_minter");

    //should be able to give the role back and mint again
    await articleNFT.connect(admin).grantRole(minterRole, minter)
    await expect(
      articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("article_unavailable");
  })

  it("should not be able to revoke or add the minter role from an unprivileged account", async () => {
    await expect(
      articleNFT.connect(unpriviledged0).grantRole(minterRole, unpriviledged0)
    ).to.be.revertedWith("AccessControl: sender must be an admin to grant")

    await expect(
      articleNFT.connect(unpriviledged0).revokeRole(minterRole, minter)
    ).to.be.revertedWith("AccessControl: sender must be an admin to revoke")
  })

  it("should be able to change the admin role", async () => {
    const newAdmin = unpriviledged0
    await articleNFT.connect(admin).grantRole(adminRole, newAdmin)
    await articleNFT.connect(admin).revokeRole(adminRole, admin)

    //privileged functions should no longer work
    await expect(
      articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999", "uri0")
    ).to.be.revertedWith("only_admin")

    //should be able to call privileged functions with new admin
    await expect(
      articleNFT.connect(newAdmin).createNewArticle(0, "99999999999999999999999999999999999", "uri0")
    ).not.to.be.revertedWith("only_admin")
  })


  it("should not be able to revoke or add the admin role from an unprivileged account", async () => {
    await expect(
      articleNFT.connect(unpriviledged0).grantRole(adminRole, unpriviledged0)
    ).to.be.revertedWith("AccessControl: sender must be an admin to grant")

    await expect(
      articleNFT.connect(unpriviledged0).revokeRole(adminRole, minter)
    ).to.be.revertedWith("AccessControl: sender must be an admin to revoke")
  })
})