require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
const dotenv = require('dotenv');
dotenv.config();

const defaultNetwork = 'localhost';

module.exports = {
  defaultNetwork,
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    matic: {
      url: `https://rpc-mumbai.maticvigil.com/v1/${process.env.MATIC_VIGIL_API_KEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
  },
  solidity: '0.8.4',
  etherscan: {
    // Polygonscan API Key
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};
