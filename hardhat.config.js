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
      url: "https://sepolia.drpc.org",
      accounts: {
        mnemonic: "nig nog nig nog nig nog nig nog nig nog nig nog",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
  },
};