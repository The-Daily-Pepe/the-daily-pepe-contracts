# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

The daily pepe nft contracts are implemented using openzeppelin's transparentUpgradeableProxy with a ProxyAdmin

the contract ProxyAdmin is owned by the admin account, it is used for admin functions relating to the proxy itself. when making proxy admin actions, (like upgrading the logic implementation, you must call the proxyAdmin contract), if making admin actions to the logic implementation you may call the proxy directly from the admin account.

admin account -owns-> ProxyAdmin -owns-> TransaparentUpgradeableProxy -points to-> (ArticleNFT and MintController)

Also:

admin account -owns-> (ArticleNFT and MintController)
