import { Contract } from "ethers";
import * as dotenv from "dotenv";
const { ethers } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3();
dotenv.config();

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
    [process.env.CONTRACT_NAME]
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
  const [owner, admin] = await ethers.getSigners();

  // Retrieve the addresses of the signers
  const adminAddress = await admin.getAddress();

  // Set the admin address by calling the setAdmin function on the contract
  // using the owner's signer
  const setAdminTx = await contract.connect(owner).setAdmin(adminAddress);
  console.log("setAdminTx", setAdminTx);

  // Set the sender1 address by calling the setSender function on the contract
  // using the admin's signer
  const setSenderOneTx = await contract
    .connect(admin)
    .setSender(process.env.SENDER_ONE_ADDRESS);
  console.log("setSenderOneTx", setSenderOneTx);

  // Set the sender2 address by calling the setSender function on the contract
  // using the admin's signer
  const setSenderTwoTx = await contract
    .connect(admin)
    .setSender(process.env.SENDER_TWO_ADDRESS);
  console.log("setSenderTwoTx", setSenderTwoTx);

  // Set the sender3 address by calling the setSender function on the contract
  // using the admin's signer
  const setSenderThreeTx = await contract
    .connect(admin)
    .setSender(process.env.SENDER_THREE_ADDRESS);
  console.log("setSenderThreeTx", setSenderThreeTx);

  // Transfer the ownership of the contract to the newOwner address
  // by calling the transferOwnership function on the contract
  // using the owner's signer
  const transferOwnerShipTx = await contract
    .connect(owner)
    .transferOwnership(process.env.NEW_OWNER_ADDRESS);
  console.log("transferOwnerShipTx", transferOwnerShipTx);
}

contractDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error); 
    process.exit(1);
  });
