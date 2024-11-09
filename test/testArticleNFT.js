const { expect } = require("chai")
const { ethers } = require("hardhat");
const { fastForwardTime } = require("./utils");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");


describe("ArticleNFT", () => {
  let admin, minter, unpriviledged0, unpriviledged1, articleNFT
  beforeEach(async () => {
    [admin, minter, unpriviledged0, unpriviledged1, benefactor] = await ethers.getSigners()
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT")
    articleNFT = await articleNFTFactory.deploy()
    await articleNFT.initialize(admin, minter, "1000")
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
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)
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
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, block.timestamp+11, "uri0")
    await fastForwardTime(1000)
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
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)
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
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)

    await expect(
      articleNFT.connect(unpriviledged0).mint(unpriviledged0.address, 0, 1)
    ).to.be.revertedWith("only_minter")
  })

  it("safeTransferFrom() owner's account without permission", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)
    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)

    await articleNFT.connect(unpriviledged0).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
  })

  it("safeTransferFrom() another account without permission", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)

    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)

    await expect(
      articleNFT.connect(unpriviledged1).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    ).to.be.revertedWith("Need operator approval for 3rd party transfers.")
  })

  it("safeTransferFrom() another account with permission", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)

    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(unpriviledged0).setApprovalForAll(unpriviledged1, true)

    await articleNFT.connect(unpriviledged1).safeTransferFrom(unpriviledged0.address, unpriviledged1.address, 0, 1, '0x00')
    expect(
      await articleNFT.balanceOf(unpriviledged1.address, 0)
    ).to.equal("1")
  })

  it("safeBatchTransferFrom() owner's account without permission", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri1")
    await fastForwardTime(11)
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
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri1")
    await fastForwardTime(11)

    await articleNFT.connect(minter).mint(unpriviledged0.address, 0, 1)
    await articleNFT.connect(minter).mint(unpriviledged0.address, 1, 2)

    await expect(
      articleNFT.connect(unpriviledged1).safeBatchTransferFrom(unpriviledged0.address, unpriviledged1.address, [0, 1], [1, 2], '0x00')
    ).to.be.revertedWith("Need operator approval for 3rd party transfers.")
  })

  it("safeBatchTransferFrom() another account with permission", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri1")
    await fastForwardTime(11)

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
    await articleNFT.connect(admin).createNewArticle(block.timestamp+10, "99999999999999999999999999999999999999999999", "uri0")
    await fastForwardTime(11)
    await articleNFT.connect(admin).setURI(0, "newURI0")
    expect(
      await articleNFT.uri(0)
    ).to.equal("newURI0")

    //outside edit window
    const block2 = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await articleNFT.connect(admin).createNewArticle(block2.timestamp+10, block.timestamp+1000, "uri0")
    await fastForwardTime(10000000)

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
      articleNFT.connect(admin).createNewArticle("9999999999999999999999999999999999", "99999999999999999999999999999999999", "uri0")
    ).to.be.revertedWith("only_admin")

    //should be able to call privileged functions with new admin
    await expect(
      articleNFT.connect(newAdmin).createNewArticle("9999999999999999999999999999999999", "99999999999999999999999999999999999", "uri0")
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

  it("should be able to change the availability window", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    const startTime = block.timestamp + 100
    const endTime = startTime + 1000000
    await articleNFT.connect(admin).createNewArticle(startTime, endTime, "uri0")
    const timeRange1 = await articleNFT.issueAvailability(0)
    await articleNFT.connect(admin).setIssueAvailability(startTime+1, endTime+1, 0)
    const timeRange2 = await articleNFT.issueAvailability(0)
    expect(timeRange2[0]).to.equal(timeRange1[0]+1n)
    expect(timeRange2[1]).to.equal(timeRange1[1]+1n)

  })

  it("should not be able to change the availability window to be less than the current block time", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    await expect(
      articleNFT.connect(admin).createNewArticle(block.timestamp-1, "9999999999999999999999999999", "uri0")
    ).to.be.revertedWith("start_time_less_than_block_time")
  })

  it("should not be able to change the availability window from an unprivileged account", async () => {
    await expect(
      articleNFT.connect(unpriviledged0).createNewArticle(0, 0, "uri0")
    ).to.be.revertedWith("only_admin")
  })

  it("should not be able to deploy an NFT with the same URI as the previous NFT", async () => {
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    const startTime = block.timestamp + 100
    const endTime = startTime + 1000000
    await articleNFT.connect(admin).createNewArticle(startTime, endTime, "uri0")
    await expect(
      articleNFT.connect(admin).createNewArticle(startTime, endTime, "uri0")
    ).to.be.revertedWith("duplicate_URI")
  })

  it("should not be able to create a new article if the auction start time is less than the current block time", async () => {
    await expect(
      articleNFT.connect(admin).createNewArticle(0, "99999999999999999999999999999999999999999999", "uri0")
    ).to.be.revertedWith("start_time_less_than_block_time")
  })
})