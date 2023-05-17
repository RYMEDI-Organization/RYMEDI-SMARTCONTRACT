import { expect, assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { Signer } from "ethers";
const { ethers } = require("hardhat");
import { contractDeployment } from "./deploy";
import { getEvents, txReceipt } from "./utility";

/**
 * Test suite for the "Admin" functionality.
 */
describe("Admin", function () {
  let Contract: Contract, // Stores the contract instance
    defaultAdminRole: string, // Stores the default admin role
    senderRole: string, // Stores the sender role
    adminRole: string, // Stores the admin role
    owner: Signer, // Stores the owner signer
    ownerAddress: string, // Stores the address of the owner
    admin: Signer, // Stores the admin signer
    adminAddress: string, // Stores the address of the admin
    firstSender: Signer, // Stores the first sender signer
    firstSenderAddress: string, // Stores the address of the first sender
    secondSender: Signer, // Stores the second sender signer
    secondSenderAddress: string, // Stores the address of the second sender
    nonSender: Signer, // Stores the non-sender signer
    nonSenderAddress: string; // Stores the address of the non-sender
  /**
   * Runs before each test case to set up the contract and signers.
   */
  beforeEach(async function () {
    const { contract } = await loadFixture(contractDeployment);
    Contract = contract;

    // Retrieve the default admin role, sender role, and admin role from the contract
    defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
    senderRole = await contract.SENDER();
    adminRole = await contract.ADMIN();

    // Retrieve the owner signer and its address
    owner = await ethers.provider.getSigner(0);
    ownerAddress = await owner.getAddress();

    // Retrieve the admin signer and its address
    admin = await ethers.provider.getSigner(1);
    adminAddress = await admin.getAddress();

    // Retrieve the first sender signer and its address
    firstSender = await ethers.provider.getSigner(2);
    firstSenderAddress = await firstSender.getAddress();

    // Retrieve the second sender signer and its address
    secondSender = await ethers.provider.getSigner(3);
    secondSenderAddress = await secondSender.getAddress();

    // Retrieve the non-sender signer and its address
    nonSender = await ethers.provider.getSigner(4);
    nonSenderAddress = await nonSender.getAddress();
  });

  describe("setAdmin()", () => {
    it("should set a new ADMIN", async () => {
      await Contract.connect(owner).setAdmin(adminAddress);
      expect(await Contract.isAdmin(adminAddress)).to.be.true;
    });
    it("should revert if called by admin", async () => {
      await expect(Contract.connect(admin).setAdmin(nonSenderAddress)).to.be
        .reverted;
    });

    it("should revert if called by a non-owner", async () => {
      await expect(Contract.connect(secondSender).setAdmin(adminAddress)).to.be
        .reverted;
    });
  });

  describe("setSender()", () => {
    it("should set a new SENDER", async () => {
      await Contract.connect(owner).setAdmin(adminAddress);
      await Contract.connect(admin).setSender(firstSenderAddress);
      expect(await Contract.isSender(firstSenderAddress)).to.be.true;
    });

    it("should revert if called by owner", async () => {
      await expect(Contract.connect(owner).setSender(secondSenderAddress)).to.be
        .reverted;
    });

    it("should revert if called by a non-admin", async () => {
      await expect(Contract.connect(secondSender).setSender(firstSenderAddress))
        .to.be.reverted;
    });
  });

  describe("revokeAdmin()", () => {
    it("should revert if called by a non-owner", async () => {
      await expect(Contract.connect(secondSender).revokeAdmin(adminAddress)).to
        .be.reverted;
    });

    it("should revert if called by a non-sender", async () => {
      await expect(Contract.connect(nonSender).revokeAdmin(adminAddress)).to.be
        .reverted;
    });

    it("should revoke the ADMIN by owner", async () => {
      await Contract.connect(owner).revokeAdmin(adminAddress);
      expect(await Contract.isAdmin(adminAddress)).to.be.false;
    });
  });

  describe("revokeSender()", function () {
    it("should revert if caller is not admin", async function () {
      await Contract.connect(owner).setAdmin(adminAddress);
      // set up a sender role and assign it to an address
      const senderNewRole =
        "0xcf2b1209506b76f140fb1bc5fe66d6e42627c4b9703a951d65552f50f14c9ef7";
      await Contract.connect(owner).grantRole(
        senderNewRole,
        firstSenderAddress
      );

      // attempt to revoke the sender role as a non-admin
      await expect(
        Contract.connect(secondSender).revokeSender(firstSenderAddress)
      ).to.be.reverted;
    });

    // **This is getting failed, we have to look at this**

    it("should revert if address does not have sender role", async function () {
      // set up a non-sender role and assign it to an address
      await Contract.connect(owner).setAdmin(adminAddress);
      // attempt to revoke the sender role from an address that does not have it
      console.log(await Contract.hasRole(senderRole, firstSenderAddress));
      await expect(Contract.connect(admin).revokeSender(firstSenderAddress)).to
        .be.reverted;
    });

    it("should revoke sender role from address", async function () {
      await Contract.connect(owner).setAdmin(adminAddress);
      // set up a sender role and assign it to an address
      await Contract.connect(admin).grantRole(senderRole, firstSenderAddress);

      // revoke the sender role from the address
      const tx = await Contract.connect(admin).revokeSender(firstSenderAddress);

      // check that the sender role was removed
      assert.isFalse(await Contract.hasRole(senderRole, firstSenderAddress));

      tx.wait();
      const receipt = await txReceipt(tx.hash);
      const events = await getEvents(Contract, receipt);
      expect(events[0].name).to.equal("RoleRevoked");
      expect(events[0].args.role).to.equal(senderRole);
      expect(events[0].args.account).to.equal(firstSenderAddress);
      expect(events[0].args.sender).to.equal(adminAddress);
    });
  });

  describe("isOwner()", () => {
    it("should return true if the caller is the contract owner", async () => {
      expect(await Contract.isOwner(ownerAddress)).to.be.true;
    });

    it("should return false if the caller is not the contract owner", async () => {
      expect(await Contract.isOwner(firstSenderAddress)).to.be.false;
    });
  });

  describe("isSender()", () => {
    it("should return true if the caller has the SENDER role", async () => {
      await Contract.connect(owner).setAdmin(adminAddress);
      await Contract.connect(admin).setSender(firstSenderAddress);

      expect(await Contract.isSender(firstSenderAddress)).to.be.true;
    });

    it("should return false if the caller doesn't have the SENDER role", async () => {
      expect(await Contract.isSender(adminAddress)).to.be.false;
    });
  });

  describe("isAdmin()", () => {
    it("should return true if the caller has the ADMIN role", async () => {
      await Contract.connect(owner).setAdmin(adminAddress);

      expect(await Contract.isAdmin(adminAddress)).to.be.true;
    });

    it("should return false if the caller doesn't have the ADMIN role", async () => {
      expect(await Contract.isAdmin(secondSenderAddress)).to.be.false;
    });
  });

  describe("grantRole()", function () {
    it("should grant a role to an account", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      const senderRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("SENDER")
      );

      await Contract.connect(owner).grantRole(role, adminAddress);

      const newAdmin = await ethers.provider.getSigner(5);
      await Contract.connect(owner).grantRole(
        role,
        await newAdmin.getAddress()
      );

      await Contract.connect(newAdmin).grantRole(
        senderRole,
        firstSenderAddress
      );
      const hasRole = await Contract.hasRole(role, adminAddress);
      const hasSenderRole = await Contract.hasRole(
        senderRole,
        firstSenderAddress
      );

      expect(hasRole).to.equal(true);
      expect(hasSenderRole).to.equal(true);
    });

    it("should emit a RoleGranted event", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      const tx = await Contract.connect(owner).grantRole(role, adminAddress);
      await tx.wait(); // wait for the transaction to be mined

      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);

      expect(logs[0].name).to.equal("RoleGranted");
      expect(logs[0].args["role"]).to.equal(role);
      expect(logs[0].args["account"]).to.equal(adminAddress);
      expect(logs[0].args["sender"]).to.equal(ownerAddress);
    });

    it("should not allow a non-admin to grant a role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      await expect(Contract.connect(admin).grantRole(role, adminAddress)).to.be
        .reverted;
    });
  });

  describe("revokeRole()", function () {
    it("should revoke a role from an account", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      await Contract.connect(owner).grantRole(role, adminAddress);
      await Contract.connect(owner).revokeRole(role, adminAddress);
      const hasRole = await Contract.hasRole(role, adminAddress);
      expect(hasRole).to.equal(false);
    });

    it("should emit a RoleRevoked event", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      const senderRole = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("SENDER")
      );
      await Contract.connect(owner).grantRole(role, adminAddress);
      await Contract.connect(admin).grantRole(senderRole, firstSenderAddress);

      const tx = await Contract.connect(admin).revokeRole(
        senderRole,
        firstSenderAddress
      );
      tx.wait();
      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);

      expect(logs[0].name).to.equal("RoleRevoked");
      expect(logs[0].args["role"]).to.equal(senderRole);
      expect(logs[0].args["account"]).to.equal(firstSenderAddress);
      expect(logs[0].args["sender"]).to.equal(adminAddress);
    });

    it("should not allow a non-admin role to revoke a role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      await Contract.connect(owner).grantRole(role, adminAddress);
      await expect(
        Contract.connect(firstSender).revokeRole(role, firstSenderAddress)
      ).to.be.reverted;
    });
  });
  describe("hasRole()", function () {
    it("should return true if an account has been granted a role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      await Contract.connect(owner).grantRole(role, adminAddress);
      const hasRole = await Contract.hasRole(role, adminAddress);
      expect(hasRole).to.equal(true);
    });

    it("should return false if an account has not been granted a role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      const hasRole = await Contract.hasRole(role, adminAddress);
      expect(hasRole).to.equal(false);
    });
  });
  describe("getRoleAdmin()", function () {
    it("should return DEFAULT_ADMIN_ROLE as the admin of the role", async function () {
      const expectedAdminRole = await Contract.getRoleAdmin(adminRole);
      expect(expectedAdminRole).to.equal(ethers.constants.HashZero);
    });
    it("should return Admin role as the admin of the sender role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SENDER"));

      const expectedAdminRole = await Contract.getRoleAdmin(role);
      expect(expectedAdminRole).to.equal(adminRole);
    });
    it("should return DEFAULT_ADMIN_ROLE  as the admin of the default admin role", async function () {
      const role = ethers.constants.HashZero;

      const expectedAdminRole = await Contract.getRoleAdmin(role);
      expect(expectedAdminRole).to.equal(role);
    });
    it("should return DEFAULT_ADMIN_ROLE  as the admin of the non-sender, non-admin roles", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UNKNOWN"));

      const expectedAdminRole = await Contract.getRoleAdmin(role);
      expect(expectedAdminRole).to.equal(ethers.constants.HashZero);
    });
  });

  describe("supportsInterface()", function () {
    it("should return true for AccessControl interface", async function () {
      expect(await Contract.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("should return true for ERC165 interface", async function () {
      expect(await Contract.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("should return false for invalid interface", async function () {
      expect(await Contract.supportsInterface("0xffffffff")).to.be.false;
    });
  });

  describe("renounceRole()", function () {
    it("should revert if owner is renouncing", async function () {
      await expect(
        Contract.connect(owner).renounceRole(
          defaultAdminRole,
          firstSenderAddress
        )
      ).to.be.reverted;
    });

    it("should revert if caller is not a member of the role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SENDER"));
      // Try to renounce the role as a non-member
      await expect(
        Contract.connect(admin).renounceRole(role, firstSenderAddress)
      ).to.be.revertedWith("AccessControl: can only renounce roles for self");
    });

    it("should revoke the role if caller is a member of the role", async function () {
      const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      // Grant the role to the account
      await Contract.connect(owner).grantRole(role, adminAddress);

      // Renounce the role as a member
      const tx = await Contract.connect(admin).renounceRole(role, adminAddress);
      tx.wait();

      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);

      expect(logs[0].name).to.equal("RoleRevoked");
      expect(logs[0].args["role"]).to.equal(role);
      expect(logs[0].args["account"]).to.equal(adminAddress);
      expect(logs[0].args["sender"]).to.equal(adminAddress);

      // Check that the account is no longer a member of the role
      expect(await Contract.hasRole(role, adminAddress)).to.be.false;
    });
  });

  describe("transferOwnership()", function () {
    it("should allow owner to transfer ownership", async function () {
      // call transferOwnership from `owner` to `newOwner`
      await Contract.connect(owner).transferOwnership(adminAddress);

      // Check that `newOwner` now has `DEFAULT_ADMIN_ROLE`
      const isAdmin = await Contract.hasRole(defaultAdminRole, adminAddress);
      expect(isAdmin).to.be.true;

      // Check that `owner` no longer has `DEFAULT_ADMIN_ROLE`
      const isNotAdmin = await Contract.hasRole(defaultAdminRole, ownerAddress);
      expect(isNotAdmin).to.be.false;
    });

    it("should not allow non-admin to transfer ownership", async function () {
      // call transferOwnership from `newOwner` to `owner`
      await expect(Contract.connect(admin).transferOwnership(ownerAddress)).to
        .be.reverted;

      // Check that `newOwner` does not have `DEFAULT_ADMIN_ROLE`
      const isNotAdmin = await Contract.hasRole(defaultAdminRole, adminAddress);
      expect(isNotAdmin).to.be.false;
    });
  });
});
