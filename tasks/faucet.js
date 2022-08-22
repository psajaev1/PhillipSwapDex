const fs = require("fs");

// This file is only here to make interacting with the Dapp easier,
// feel free to ignore it if you don't need it.

task("faucet", "Sends ETH and tokens to an address")
  .addPositionalParam("receiver", "The address that will receive them")
  .setAction(async ({ receiver }, { ethers }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the faucet task with Hardhat network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }

    const addressesFile =
      __dirname + "/../frontend/src/contracts/contract-address.json";

    if (!fs.existsSync(addressesFile)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(addressesFile);
    const address = JSON.parse(addressJson);

    if ((await ethers.provider.getCode(address.TokenA)) === "0x") {
      console.error("You need to deploy your contract first");
      return;
    }

    const tokenA = await ethers.getContractAt("TokenA", address.TokenA);
    const [sender] = await ethers.getSigners();

    const tx = await tokenA.transfer(receiver, 10000);
    await tx.wait();

    const tokenB = await ethers.getContractAt("TokenB", address.TokenB);

    const txB = await tokenB.transfer(receiver, 10000);
    await txB.wait();

    const tx2 = await sender.sendTransaction({
      to: receiver,
      value: ethers.constants.WeiPerEther,
    });
    await tx2.wait();

    console.log(`Transferred 1 ETH and 10000 tokens to ${receiver}`);
  });
