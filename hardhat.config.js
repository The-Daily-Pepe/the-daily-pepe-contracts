require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/Bs8E8y22L3R-hY3kT6HgoPVpWK6PyIs0",
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/420'/69'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
    base: {
      url: "https://base-mainnet.g.alchemy.com/v2/oQeryXfWdKuMhJ_m3wIPoXxASGnOjGDd",
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/420'/69'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    }
  },
};