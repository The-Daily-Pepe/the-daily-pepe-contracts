require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.7.6",
  },
  networks: {
    sepolia: {
      url: "...",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
  },
};