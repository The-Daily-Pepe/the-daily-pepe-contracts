const { expect } = require("chai")
const { ethers } = require("hardhat")
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

const adminRole = ethers.zeroPadBytes("0x69696969", 32)

describe("FirstEditionArticleNFT", () => {
  let admin, minter, unpriviledged0, unpriviledged1, firstEditionNFT
  beforeEach(async () => {
    [admin, minter, unpriviledged0, unpriviledged1] = await ethers.getSigners()
    firstEditionNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT")
    firstEditionNFT = await firstEditionNFTFactory.deploy()
    proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", admin)
    proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", admin)
    proxyAdmin = await proxyAdminFactory.deploy()
    proxy = await proxyFactory.deploy(firstEditionNFT.target, proxyAdmin, "0x")

    firstEditionNFT = await firstEditionNFTFactory.attach(proxy.target)
    await firstEditionNFT.initialize(admin, "100", "Daily Pepe First Edition", "DPEPE")
  })

  it("should not be able to call initialize multiple times", async () => {
    await expect(
      firstEditionNFT.initialize(admin, "100", "Daily Pepe First Edition", "DPEPE")
    ).to.be.revertedWith("no_re-init")
  })


  it("should implement the ERC1155 interfaces", async () => {
    const ERC721StandardInterface = "0x80ac58cd"
    const metadataURIInterface = "0x5b5e139f"
    const enumerableInterface = "0x780e9d63"

    expect(
      await firstEditionNFT.supportsInterface(ERC721StandardInterface)
    ).to.equal(true)

    expect(
      await firstEditionNFT.supportsInterface(metadataURIInterface)
    ).to.equal(true)

    expect(
      await firstEditionNFT.supportsInterface(enumerableInterface)
    ).to.equal(true)
  })

  it("createNewArticle from priviledged account", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "420")
    expect(
      await firstEditionNFT.tokenURI(0)
    ).to.equal("420")

    expect(
      await firstEditionNFT.ownerOf(0)
    ).to.equal(admin.address)
  })

  it("createNewArticle from unpriviledged account", async () => {
    await expect(
      firstEditionNFT.connect(unpriviledged0).createNewArticle(admin.address, "420")
    ).to.be.revertedWith("only_admin")
  })

  it("should be able to change the admin role", async () => {
    const newAdmin = unpriviledged0
    await firstEditionNFT.connect(admin).grantRole(adminRole, newAdmin)
    await firstEditionNFT.connect(admin).revokeRole(adminRole, admin)

    //privileged functions should no longer work
    await expect(
      firstEditionNFT.connect(admin).createNewArticle(admin.address, "420")
    ).to.be.revertedWith("only_admin")

    //should be able to call privileged functions with new admin
    await expect(
      firstEditionNFT.connect(newAdmin).createNewArticle(admin.address, "420")
    ).not.to.be.revertedWith("only_admin")
  })

  it("should not be able to revoke or add the admin role from an unprivileged account", async () => {
    await expect(
      firstEditionNFT.connect(unpriviledged0).grantRole(adminRole, unpriviledged0)
    ).to.be.revertedWith("AccessControl: sender must be an admin to grant")

    await expect(
      firstEditionNFT.connect(unpriviledged0).revokeRole(adminRole, minter)
    ).to.be.revertedWith("AccessControl: sender must be an admin to revoke")
  })

  it("transferFrom self should succeed", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "420")
    await firstEditionNFT.connect(admin).safeTransferFrom(admin.address, unpriviledged0.address, 0)
    expect(
      await firstEditionNFT.ownerOf(0)
    ).to.equal(unpriviledged0.address)
  })

  it("transferFrom other with permission should succeed", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")
    await firstEditionNFT.connect(admin).approve(unpriviledged0, 0)

    await firstEditionNFT.connect(unpriviledged0).safeTransferFrom(admin.address, unpriviledged0.address, 0)
    expect(
      await firstEditionNFT.ownerOf(0)
    ).to.equal(unpriviledged0.address)
  })

  it("transferFrom other without permission should fail", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")

    await expect(
      firstEditionNFT.connect(unpriviledged1).safeTransferFrom(admin.address, unpriviledged1.address, 0)
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved")
  })

  it("uri should be editable inside edit window by admin", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")
    await firstEditionNFT.connect(admin).setURI(0, "newURI")
    expect(
      await firstEditionNFT.tokenURI(0)
    ).to.equal("newURI")
  })

  it("uri should not be editable inside edit window by non-admin", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")
    await expect(
      firstEditionNFT.connect(unpriviledged0).setURI(0, "newURI")
    ).to.be.revertedWith("only_admin")
  })

  it("uri should not be editable outside edit window by admin", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")
    await time.increase(await time.latest()+101)
    await expect(
      firstEditionNFT.connect(admin).setURI(0, "newURI")
    ).to.be.revertedWith("cannot edit URI past edit window")
  })

  it("uri should not be editable outside edit window by non-admin", async () => {
    await firstEditionNFT.connect(admin).createNewArticle(admin.address, "uri0")
    await time.increase(await time.latest()+101)
    await expect(
      firstEditionNFT.connect(unpriviledged0).setURI(0, "newURI")
    ).to.be.revertedWith("only_admin")
  })
})