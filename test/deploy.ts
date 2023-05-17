// scripts/test.js
import CryptoJS from 'crypto-js';
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



export async function contractDeployment() {
    //this will deploy the logic contract
    const logicContract = await deployLogicContract();
    console.log("logicContract", logicContract.address)

    // this will deploy the successor of logic contract
    // const logicContract1 = await deployLogicContract1();
    // we have to pass this constructor function in proxy contract
    console.log(web3.eth.abi, "===============================")
    // const contructData = await web3.utils.sha3("rymediInitialize(string)").substring(0, 10);
    const functionSignature = await web3.eth.abi.encodeParameters(["string"], ["RymediTesting"]);
    console.log("0000000000000000", functionSignature)
    let _initData = web3.eth.abi.encodeFunctionCall({
        name: 'rymediInitialize',
        type: 'function',
        inputs: [{type: 'string', name: '_name'}]}, ["RymediTesting"]);

    // const arg = web3.eth.abi.encodeParameter('string', 'rymediTesting');
    const encodedData = _initData;
    // const encodedData = functionSignature + arg.substring(2);


    // const contructData = await web3.utils.sha3("rymediInitialize(PHI)").substring(0, 10);
    console.log("contructData", encodedData)
    const proxyContract = await deployProxyContract(encodedData, logicContract);
    console.log(proxyContract.address, "proxyContract")



    // Get the ABI of the logic contract
    const LogicContract = await ethers.getContractFactory("Rymedi");
    const logicContractInterface = LogicContract.interface;

    // Get the ABI of the logic1 contract
    // const LogicContract1 = await ethers.getContractFactory("RecordKeeper1");
    // const logicContractInterface1 = LogicContract.interface;

    // Create an instance of the logic contract using its ABI and address
    const contract = new ethers.Contract(
        proxyContract.address,
        logicContractInterface,
        ethers.provider
    );

    return { contract, proxyContract, logicContract };
}

export function hash(value) {
    return "0x" + CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

export function keckkak(value) {
    return "0x" + CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}