require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");

const ALCHEMY_API_KEY = "RWfYADQdLjY9J4TBwFdul5ljm7-toiiD";

const GOERLI_PRIVATE_KEY = "9919170bdfb0d2909b644ccefcf6b10b9a58f6f373c6e58415b991049d5c0f30";


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 1337, // We set 1337 to make interacting with MetaMask simpler
    }, 
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  }
};
