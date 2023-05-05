// scripts/test.js
const { ethers } = require("hardhat");
const web3 = require("web3");

// Define the logic contract
async function deployLogicContract() {
  const LogicContract = await ethers.getContractFactory("Rymedi");
  const logicContract = await LogicContract.deploy();
  await logicContract.deployed();

  console.log("LogicContract deployed to:", logicContract.address);
  return logicContract;
}


// // Define the logic1 contract
// async function deployLogicContract1() {
//   const LogicContract = await ethers.getContractFactory("RecordKeeper1");
//   const logicContract = await LogicContract.deploy();
//   await logicContract.deployed();

//   console.log("LogicContract1 deployed to:", logicContract.address);
//   return logicContract;
// }


// Define the proxy contract
async function deployProxyContract(constructData: any, logicContract: any) {
  const ProxyContract = await ethers.getContractFactory("Proxy");
  const proxyContract = await ProxyContract.deploy(
    constructData,
    logicContract.address
  );
  await proxyContract.deployed();

  console.log("ProxyContract deployed to:", proxyContract.address);
  return proxyContract;
}






async function main() {
  //this will deploy the logic contract
  const logicContract = await deployLogicContract();
  // this will deploy the successor of logic contract
  // const logicContract1 = await deployLogicContract1();

  // we have to pass this constructor function in proxy contract
  const contructData = await web3.utils.sha3("initialize()").substring(0, 10);
  const proxyContract = await deployProxyContract(contructData, logicContract);

  // Get the ABI of the logic contract
  const LogicContract = await ethers.getContractFactory("Rymedi");
  const logicContractInterface = LogicContract.interface;

  // Get the ABI of the logic1 contract
  // const LogicContract1 = await ethers.getContractFactory("RecordKeeper1");
  // const logicContractInterface1 = LogicContract.interface;

  // Create an instance of the logic contract using its ABI and address
  const proxy = new ethers.Contract(
    proxyContract.address,
    logicContractInterface,
    ethers.provider
  );

  // Connect the contract instance to a signer
  const signer = await ethers.provider.getSigner();
  const contractWithSigner = proxy.connect(signer);
  console.log("contractWithSigner", contractWithSigner);

  // Call the addRecord function on the logic contract through the proxy contract
  const add = await contractWithSigner.addRecord(
    "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f",
    "0xd4a9ed9a766b3f61d12b3e899421b2487040d960a6b1d7ffa3d18cbb97a57e34"
  );
  console.log(add, "1");

  // method for getting the record
  const value = await contractWithSigner.getRecord(
    "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f"
  );
  console.log(value, "2");

  //updating the code of smart contract by passing new smartContract address
  // const update = await contractWithSigner.updateCode(logicContract1.address);
  // console.log(update)

  //method for removing the record
  const remove = await contractWithSigner.removeRecord("0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f");
  console.log(remove, "3")

    // method for getting the record
    const valueAgain = await contractWithSigner.getRecord(
      "0xab1f7b7600761ef53800ccb5fd8b18827e4e7f191534d11a33ebbfa5482b767f"
    );
    console.log(valueAgain,"4");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
