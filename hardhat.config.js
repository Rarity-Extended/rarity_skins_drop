require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const { scanKey, PRIVATE_KEY, ANOTHER_PRIVATE_KEY } = require('./secrets.json');

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.ftm.tools',
        timeout: 20000000000
      },
      chainId: 250
    },
    localhost: {
      url: "http://localhost:8545",
      timeout: 2000000000,
      accounts: [PRIVATE_KEY, ANOTHER_PRIVATE_KEY]
    },
    fantom: {
      chainId: 250,
      url: 'https://rpc.ftm.tools',
      accounts: [PRIVATE_KEY, ANOTHER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: scanKey
  },
};