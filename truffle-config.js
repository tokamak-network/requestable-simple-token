require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    rootchain: {
      host: 'localhost',
      port: 8546,
      network_id: '*', // eslint-disable-line camelcase
      websocket: true,
    },
    plasma: {
      host: 'localhost',
      port: 8547,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  compilers: {
    solc: {
      version: '0.5.8',
    },
  },
};
