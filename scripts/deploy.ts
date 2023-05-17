import { Contract } from "ethers";

const { ethers } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3();

// Define the logic contract
async function deployLogicContract() {
  const LogicContract = await ethers.getContractFactory("Rymedi");
  const logicContract = await LogicContract.deploy();
  await logicContract.deployed();

  console.log("LogicContract deployed to:", logicContract.address);
  return logicContract;
}

// Define the proxy contract
async function deployProxyContract(
  constructData: string,
  logicContract: Contract
) {
  const ProxyContract = await ethers.getContractFactory("Proxy");
  const proxyContract = await ProxyContract.deploy(
    constructData,
    logicContract.address
  );
  await proxyContract.deployed();

  console.log("ProxyContract deployed to:", proxyContract.address);
  return proxyContract;
}

export async function contractDeployment() {
  //this will deploy the logic contract

  const logicContract = await deployLogicContract();
  // we have to pass this constructor function in proxy contract

  const encodedData = await web3.eth.abi.encodeFunctionCall(
    {
      name: "rymediInitialize",

      type: "function",

      inputs: [{ type: "string", name: "_name" }],
    },
    ["RymediTesting"]
  );
  const proxyContract = await deployProxyContract(encodedData, logicContract);

  // Get the ABI of the logic contract
  const LogicContract = await ethers.getContractFactory("Rymedi");
  const logicContractInterface = LogicContract.interface;

  // Create an instance of the logic contract using its ABI and address
  const contract = new ethers.Contract(
    proxyContract.address,
    logicContractInterface,
    ethers.provider
  );

  // Destructuring assignment to obtain the signers
  const [owner, admin, sender1, sender2, sender3, newOwner] =
    await ethers.getSigners();

  // Retrieve the addresses of the signers
  const adminAddress = await admin.getAddress();
  const sender1Address = await sender1.getAddress();
  const sender2Address = await sender2.getAddress();
  const sender3Address = await sender3.getAddress();
  const newOwnerAddress = await newOwner.getAddress();

  // Set the admin address by calling the setAdmin function on the contract
  // using the owner's signer
  const adminTx = await contract.connect(owner).setAdmin(adminAddress);
  console.log("adminTx", adminTx);

  // Set the sender1 address by calling the setSender function on the contract
  // using the admin's signer
  const senderOneTx = await contract.connect(admin).setSender(sender1Address);
  console.log("senderOneTx", senderOneTx);

  // Set the sender2 address by calling the setSender function on the contract
  // using the admin's signer
  const senderTwoTx = await contract.connect(admin).setSender(sender2Address);
  console.log("senderTwoTx", senderTwoTx);

  // Set the sender3 address by calling the setSender function on the contract
  // using the admin's signer
  const senderThreeTx = await contract.connect(admin).setSender(sender3Address);
  console.log("senderThreeTx", senderThreeTx);
  
  // Transfer the ownership of the contract to the newOwner address
  // by calling the transferOwnership function on the contract
  // using the owner's signer
  const senderFourTx = await contract
    .connect(owner)
    .transferOwnership(newOwnerAddress);
  console.log("senderFourTx", senderFourTx);
}

contractDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
