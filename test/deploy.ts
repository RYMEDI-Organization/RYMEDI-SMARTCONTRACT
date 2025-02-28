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

  // const contructData = await web3.utils
  //   .sha3("rymediInitialize()")
  //   .substring(0, 10);
  const functionSignature = await web3.eth.abi.encodeParameters(
    ["string"],
    ["RymediTesting"]
  );

  console.log("0000000000000000", functionSignature);

  let _initData = await web3.eth.abi.encodeFunctionCall(
    {
      name: "rymediInitialize",

      type: "function",

      inputs: [{ type: "string", name: "_name" }],
    },
    ["RymediTesting"]
  );
  const encodedData = _initData;
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

  return { contract, proxyContract, logicContract };
}
