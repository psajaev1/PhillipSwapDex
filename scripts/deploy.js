// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

const fs = require("fs");
const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
const addressJson = {};


async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }


  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Math = await ethers.getContractFactory("Math");
  const math = await Math.deploy();
  await math.deployed();


  addressJson["Math"] = math.address;


  const mathArtifact = artifacts.readArtifactSync("Math");

  fs.writeFileSync(
    path.join(contractsDir, "Math.json"),
    JSON.stringify(mathArtifact, null, 2)
  );

  console.log("Math address:", math.address);

  const UQ112x112 = await ethers.getContractFactory("UQ112x112");
  const uQ112x112 = await UQ112x112.deploy();
  await uQ112x112.deployed();


  addressJson["UQ112x112"] = uQ112x112.address;

  const UQ112x112Artifact = artifacts.readArtifactSync("UQ112x112");

  fs.writeFileSync(
    path.join(contractsDir, "UQ112x112.json"),
    JSON.stringify(UQ112x112Artifact, null, 2)
  );

  console.log("UQ112x112 address:", uQ112x112.address);



  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.deployed();
  addressJson["TokenA"] = tokenA.address;

  const TokenAArtifact = artifacts.readArtifactSync("TokenA");

  fs.writeFileSync(
    path.join(contractsDir, "TokenA.json"),
    JSON.stringify(TokenAArtifact, null, 2)
  );

  console.log("TokenA address:", tokenA.address);

  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy();
  await tokenB.deployed();
  addressJson["TokenB"] = tokenB.address;

  const TokenBArtifact = artifacts.readArtifactSync("TokenB");

  fs.writeFileSync(
    path.join(contractsDir, "TokenB.json"),
    JSON.stringify(TokenBArtifact, null, 2)
  );

  console.log("TokenB address:", tokenB.address);

  const Pair = await ethers.getContractFactory("Pair");
  const pair = await Pair.deploy();
  await pair.deployed();


  addressJson["Pair"] = pair.address;


  const pairArtifact = artifacts.readArtifactSync("Pair");

  fs.writeFileSync(
    path.join(contractsDir, "Pair.json"),
    JSON.stringify(pairArtifact, null, 2)
  );

  console.log("Pair address:", pair.address);


  const SwapFactory = await ethers.getContractFactory("SwapFactory");
  const swapFactory = await SwapFactory.deploy();
  await swapFactory.deployed();


  addressJson["SwapFactory"] = swapFactory.address;


  const swapFactoryArtifact = artifacts.readArtifactSync("SwapFactory");

  fs.writeFileSync(
    path.join(contractsDir, "SwapFactory.json"),
    JSON.stringify(swapFactoryArtifact, null, 2)
  );

  console.log("SwapFactory address:", swapFactory.address);


  const SwapLibrary = await ethers.getContractFactory("SwapLibrary");
  const swapLibrary = await SwapLibrary.deploy();
  await swapLibrary.deployed();


  addressJson["SwapLibrary"] = swapLibrary.address;

  const swapLibraryArtifact = artifacts.readArtifactSync("SwapLibrary");

  fs.writeFileSync(
    path.join(contractsDir, "SwapLibrary.json"),
    JSON.stringify(swapLibraryArtifact, null, 2)
  );

  console.log("SwapLibrary address:", swapLibrary.address);

  const Router = await ethers.getContractFactory("Router", {
    libraries: {
      SwapLibrary: swapLibrary.address,
    },
  });
  const router = await Router.deploy(swapFactory.address);
  await router.deployed();

  addressJson["Router"] = router.address;

  const routerArtifact = artifacts.readArtifactSync("Router");

  fs.writeFileSync(
    path.join(contractsDir, "Router.json"),
    JSON.stringify(routerArtifact, null, 2)
  );

  console.log("Router address:", router.address);




  saveToFrontEnd();

}


function saveToFrontEnd() {


  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify(addressJson)
  );
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
