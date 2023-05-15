import { expect, assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { Signer } from "ethers";
const { ethers } = require("hardhat");
import { contractDeployment } from "./deploy";
/**
 * Test suite for the "Proxiable" functionality.
 */
describe("Proxiable", function () {
  let Contract: Contract, // Stores the contract instance
    owner: Signer, //  Stores the owner signer
    admin: Signer, // Stores the admin signer
    ownerAddress: string; // Stores the address of the owner

  /**
   * Runs before each test case to set up the contract and signers.
   */

  beforeEach(async function () {
    const { contract } = await loadFixture(contractDeployment);
    Contract = contract;
    owner = await ethers.provider.getSigner(0);
    ownerAddress = await owner.getAddress();
    admin = await ethers.provider.getSigner(1);
  });

  it("should return correct proxiableUUID", async () => {
    const expectedUUID =
      "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7";

    const uuid = await Contract.proxiableUUID();

    expect(uuid).to.equal(expectedUUID);
  });

  it("should update the code address", async function () {
    // Create a new contract instance
    const MyContract = await ethers.getContractFactory("RecordKeeper");
    const myContract = await MyContract.deploy();
    const tx = await Contract.connect(owner).updateCode(myContract.address);
    tx.wait();

    // Verify that code address is updated
    const codeAddress = await ethers.provider.getStorageAt(
      Contract.address,
      "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7"
    );
    const modifiedContractAddress =
      "0x" + myContract.address.slice(2).padStart(64, "0");

    expect(codeAddress).to.equal(modifiedContractAddress.toLowerCase());
  });

  it("should emit an event", async function () {
    // Create a new contract instance
    const MyContract = await ethers.getContractFactory("RecordKeeper");
    const myContract = await MyContract.deploy();
    const tx = await Contract.connect(owner).updateCode(myContract.address);
    tx.wait();
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    const logs = receipt.logs.map((log: any) =>
      Contract.interface.parseLog(log)
    );

    expect(logs[0].name).to.equal("UpdateCodeAddress");
    expect(logs[0].args.updatedAddress).to.equal(myContract.address);
    expect(logs[0].args.sender).to.equal(ownerAddress);
  });

  it("should revert if called by non-owner", async function () {
    const newLogicAddress = "0x46E73C6b7c2A37Cf6739fD46A6034b1956f5a75a";
    await expect(Contract.connect(admin).updateCode(newLogicAddress)).to.be
      .reverted;
  });

  it("should revert if the new code is not compatible", async function () {
    const incompatibleCodeAddress =
      "0xC04f36EEac1697702ed7d5F71B55a54d23cF5cb7";

    await expect(Contract.connect(owner).updateCode(incompatibleCodeAddress)).to
      .be.reverted;
  });
});
