require('@nomiclabs/hardhat-waffle');
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
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
  },
  solidity: '0.8.4',
};
