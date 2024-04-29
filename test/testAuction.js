const { expect } = require("chai")
const { ethers } = require("hardhat")
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

const adminRole = ethers.zeroPadBytes("0x69696969", 32)
const MONTH = 2419200n;

describe("Auction for ERC721 NFT", () => {
  let admin, unpriviledged0, unpriviledged1, benefactor, auction, firstEditionNFT
  beforeEach(async () => {
    [admin, unpriviledged0, unpriviledged1, benefactor] = await ethers.getSigners()
    auctionFactory = await ethers.getContractFactory("Auction")
    firstEditionNFTFactory = await ethers.getContractFactory("FirstEditionArticleNFT")
    firstEditionNFT = await firstEditionNFTFactory.deploy()
    auction = await auctionFactory.deploy(firstEditionNFT.target, "100", MONTH, "5", ethers.parseEther("0.01"), admin.address, benefactor.address)
    await firstEditionNFT.initialize(auction.target, 100, "Daily Pepe First Edition", "DPEPE")
  })

  it("constructor should set everything correctly", async () => {
    expect(
      await auction.minAuctionDuration()
    ).to.equal(100)
    expect(
      await auction.minRaisePct()
    ).to.equal(5)
    expect(
      await auction.minRaiseAbs()
    ).to.equal(ethers.parseEther("0.01"))
    expect(
      await auction.hasRole(adminRole, admin.address)
    ).to.equal(true)
  })

  it("only admin should be able to start an auction", async () => {
    await expect(
      auction.connect(unpriviledged0).createTokenAndStartAuction("420", await time.latest()+1000)
    ).to.be.revertedWith("only_admin")
  })

  it("should not be able to bid on a token whose auction hasn't started yet", async () => {
    await expect(
      auction.connect(unpriviledged0).bid(0, unpriviledged0, {value: ethers.parseEther("0.01")})
    ).to.be.revertedWith("auction not active")
  })

  it("should not be able to bid on a token whose auction is over", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await time.increase(1001)
    await expect(
      auction.bid(0, unpriviledged0, {value: ethers.parseEther("1")})
    ).to.be.revertedWith("auction not active")
  })

  it("should not let the minimum bid be less than 0.01 ether", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await expect(
      auction.bid(0, unpriviledged0, {value: ethers.parseEther("0.009999")})
    ).to.be.revertedWith("bid not high enough")
  })

  it("should be able to bid on a token whose auction is still going", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await auction.bid(0, unpriviledged0, {value: ethers.parseEther("0.01")})
  })

  it("should not be able to bid less than the minimum", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await auction.bid(0, unpriviledged0, {value: ethers.parseEther("0.01")})
    const minBid = await auction.getMinBid(0)
    await expect(
      auction.bid(0, unpriviledged0, {value: minBid - 1n})
    ).to.be.revertedWith("bid not high enough")
    await auction.bid(0, unpriviledged0, {value: minBid})
  })

  it("should calculate the minimum bid correctly", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    expect(
      await auction.getMinBid(0)
    ).to.equal(ethers.parseEther("0.01"))
    await auction.bid(0, unpriviledged0, {value: ethers.parseEther("0.02")})

    //min bid is 0.02 + 0.01
    expect(
      await auction.getMinBid(0)
    ).to.equal(ethers.parseEther("0.03"))
    
    await auction.bid(0, unpriviledged0, {value: ethers.parseEther("1")})

    //min raise is 5% of 1
    expect(
      await auction.getMinBid(0)
    ).to.equal(ethers.parseEther("1")*105n/100n)
  })

  it("losing bids should get their money back", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    const startBalance = await ethers.provider.getBalance(unpriviledged0.address)
    await auction.connect(unpriviledged0).bid(0, unpriviledged0, {value: ethers.parseEther("1")})
    const afterBidBalance = await ethers.provider.getBalance(unpriviledged0.address)
    expect(afterBidBalance).to.be.lessThan(startBalance-ethers.parseEther("1"))
    await auction.connect(unpriviledged1).bid(0, unpriviledged0, {value: ethers.parseEther("2")})
    const afterRefundBalance = await ethers.provider.getBalance(unpriviledged0.address)
    expect(afterRefundBalance).to.equal(afterBidBalance+ethers.parseEther("1"))
  })

  it("losing bids should get their money back even if admin withdraws mid auction", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await auction.connect(unpriviledged0).bid(0, unpriviledged0, {value: ethers.parseEther("1")})
    const afterBidBalance = await ethers.provider.getBalance(unpriviledged0.address)
    await auction.connect(admin).withdraw();
    await auction.connect(unpriviledged1).bid(0, unpriviledged0, {value: ethers.parseEther("2")})
    const afterRefundBalance = await ethers.provider.getBalance(unpriviledged0.address)
    expect(afterRefundBalance).to.equal(afterBidBalance+ethers.parseEther("1"))
  })

  it("payout all should payout 10 tokens max to the correct accounts", async () => {
    //load 100 complete auctions
    for(let i = 0; i < 11; i++) {
      await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
      await auction.connect(unpriviledged0).bid(i, unpriviledged1, {value: ethers.parseEther("1")})
    }
    await time.increase(1001)
    await auction.payoutAll();
    expect(
      await firstEditionNFT.balanceOf(auction.target)
    ).to.equal(1)
    expect(
      await firstEditionNFT.balanceOf(unpriviledged1)
    ).to.equal(10)
    // await auction.payoutAll();

    //should not payout ongoing auctions
    for(let i = 11; i < 13; i++) {
      await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
      await auction.connect(unpriviledged0).bid(i, unpriviledged1, {value: ethers.parseEther("1")})
    }

    await auction.payoutAll();
    expect(
      await firstEditionNFT.balanceOf(auction.target)
    ).to.equal(2)
    expect(
      await firstEditionNFT.balanceOf(unpriviledged1)
    ).to.equal(11) //11 because we received 1 from the previous part of the test
  })

  it("withdraw should payout the benefactor", async () => {
    await auction.connect(admin).createTokenAndStartAuction("420", await time.latest()+1000)
    await auction.connect(unpriviledged0).bid(0, unpriviledged0, {value: ethers.parseEther("1")})
    const startBalance = await ethers.provider.getBalance(benefactor.address)
    await auction.connect(unpriviledged0).withdraw()
    const endBalance = await ethers.provider.getBalance(benefactor.address)
    expect(startBalance + ethers.parseEther("1") - 1n).to.equal(endBalance)
  })
})