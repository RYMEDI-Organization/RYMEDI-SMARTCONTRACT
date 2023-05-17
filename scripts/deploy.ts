import { Contract } from "ethers";

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

  const contructData = await web3.utils
    .sha3("rymediInitialize()")
    .substring(0, 10);
  const proxyContract = await deployProxyContract(contructData, logicContract);

  // Get the ABI of the logic contract
  const LogicContract = await ethers.getContractFactory("Rymedi");
  const logicContractInterface = LogicContract.interface;

  // Create an instance of the logic contract using its ABI and address
  const contract = new ethers.Contract(
    proxyContract.address,
    logicContractInterface,
    ethers.provider
  );
  const [owner, admin, sender] = await ethers.getSigners();
  const adminAddress = await admin.getAddress();
  const senderAddress = await sender.getAddress();

  await contract.connect(owner).setAdmin(adminAddress);
  await contract.connect(admin).setSender(senderAddress);
}

contractDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
