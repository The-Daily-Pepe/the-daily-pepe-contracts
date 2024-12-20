const { expect } = require("chai")
const { ethers } = require("hardhat")
const { fastForwardTime } = require("./utils")

const minterRole = ethers.zeroPadBytes("0x42042069", 32)
const adminRole = ethers.zeroPadBytes("0x69696969", 32)
const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935"

const setupNewArticle = async (admin, articleNFT, mintController, mintPrice) => {
  const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  const startTime = block.timestamp+10
  await articleNFT.connect(admin).createNewArticle(startTime, "999999999999999999999999999999999999", "uri0")
  await fastForwardTime(11)
  await mintController.setMintPrice(0, mintPrice)
}

describe("MintController", () => {
  let admin, unpriviledged0, unpriviledged1, benefactor, articleNFT, mintController
  beforeEach(async () => {
    [admin, unpriviledged0, benefactor, unpriviledged1] = await ethers.getSigners()
    articleNFTFactory = await ethers.getContractFactory("ArticleNFT", admin)
    articleNFT = await articleNFTFactory.deploy()
    mintControllerFactory = await ethers.getContractFactory("MintController")
    mintController = await mintControllerFactory.deploy(articleNFT, admin.address, benefactor.address, 20)
    await articleNFT.initialize(admin, mintController, "1000")
  })

  it("constructor should set NFT contract", async () => {
    expect(
      await mintController.nftContract()
    ).to.equal(articleNFT.target)
  })

  it("constructor should set admin", async () => {
    expect(
      await mintController.hasRole(adminRole, admin)
    ).to.equal(true)
  })

  it("mint without payment", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.mint(unpriviledged0, 0, 1)
    ).to.be.revertedWith("incorrect_payment")
  })

  it("mint with attempted overflow attack", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.mint(unpriviledged0, 0, maxUint256) 
    ).to.be.revertedWith("SafeMath: multiplication overflow")
  })

  it("mint with payment", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await mintController.mint(unpriviledged0, 0, 1, {
      value: 1000,
    })
  })

  it("mint with overpayment should revert", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.connect(unpriviledged0).mint(unpriviledged0, 0, 1, {
        value: 2000,
      })
    ).to.be.revertedWith("incorrect_payment")
  })

  it("mintAffiliate without payment", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.mintAffiliate(unpriviledged0, 0, 1, unpriviledged1)
    ).to.be.revertedWith("incorrect_payment")
  })

  it("mintAffiliate with attempted overflow attack", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.mintAffiliate(unpriviledged0, 0, maxUint256, unpriviledged1) 
    ).to.be.revertedWith("SafeMath: multiplication overflow")
  })

  it("mintAffiliate with payment", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    let balanceBefore = await ethers.provider.getBalance(unpriviledged1)
    await mintController.mintAffiliate(unpriviledged0, 0, 1, unpriviledged1, {
      value: 1000,
    })
    let balanceAfter = await ethers.provider.getBalance(unpriviledged1)
    expect(balanceAfter - balanceBefore).to.equal(50)
  })

  it("mintAffiliate with overpayment should revert", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await expect(
      mintController.connect(unpriviledged0).mintAffiliate(unpriviledged0, 0, 1, unpriviledged1, {
        value: 2000,
      })
    ).to.be.revertedWith("incorrect_payment")
  })

  it("setAffiliateShareDivisor from non-admin", async () => {
    await expect(
      mintController.connect(unpriviledged0).setAffiliateShareDivisor(0)
    ).to.be.revertedWith("only_admin")
  })

  it("setAffiliateShareDivisor from admin", async () => {
    await mintController.connect(admin).setAffiliateShareDivisor(0)
  })

  it("setMintPrice from non-admin", async () => {
    await expect(
      mintController.connect(unpriviledged0).setMintPrice(0, 0)
    ).to.be.revertedWith("only_admin")
  })

  it("setMintPrice from admin", async () => {
    await mintController.connect(admin).setMintPrice(0, 69)
    expect(
      await mintController.mintPrices(0)
    ).to.equal(69)
  })

  it("setBenefactor from non-admin", async () => {
    await expect(
      mintController.connect(unpriviledged0).setBenefactor(admin)
    ).to.be.revertedWith("only_admin")
  })

  it("setBenefactor from admin", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await mintController.mint(unpriviledged0, 0, 1, {
      value: 1000,
    })
    //should withdraw to old benefactor
    let balanceBefore = await ethers.provider.getBalance(benefactor)
    await mintController.connect(admin).setBenefactor(unpriviledged0)
    let balanceAfter = await ethers.provider.getBalance(benefactor)
    expect(balanceAfter - balanceBefore).to.equal(999)

    //should now withdraw to the new benefactor
    await mintController.mint(unpriviledged0, 0, 1, {
      value: 1000,
    })
    balanceBefore = await ethers.provider.getBalance(unpriviledged0)
    await mintController.withdraw()
    balanceAfter = await ethers.provider.getBalance(unpriviledged0)
    expect(balanceAfter - balanceBefore).to.equal(1000)
  })

  it("withdraw'", async () => {
    await setupNewArticle(admin, articleNFT, mintController, 1000)
    await mintController.mint(unpriviledged0, 0, 1, {
      value: 1000,
    })
    const balanceBefore = await ethers.provider.getBalance(benefactor)
    await mintController.withdraw()
    const balanceAfter = await ethers.provider.getBalance(benefactor)
    expect(balanceAfter - balanceBefore).to.equal(999)
  })
})