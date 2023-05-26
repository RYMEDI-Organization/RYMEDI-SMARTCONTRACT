import { expect, assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { Signer } from "ethers";

const { ethers } = require("hardhat");
import { contractDeployment } from "./deploy";
import { hash, getEvents, txReceipt } from "./utility";

describe("Rymedi", function () {
  let defaultAdminRole: string, // Stores the default admin role
    Contract: Contract, // Stores the contract instance
    senderRole: string, // Stores the sender role
    adminRole: string, // Stores the admin role
    owner: Signer, // Stores the owner signer
    admin: Signer, // Stores the admin signer
    firstSender: Signer, // Stores the first sender signer
    secondSender: Signer, // Stores the second sender signer
    nonSender: Signer, // Stores the non-sender signer
    nonSenderAddress: string, // Stores the address of the non-sender
    ownerAddress: string, // Stores the address of the owner
    adminAddress: string, // Stores the address of the admin
    firstSenderAddress: string, // Stores the address of the first sender
    secondSenderAddress: string, // Stores the address of the second sender
    messageCount: number = 0, // Keeps track of the message count, initialized to 0
    deleteCount: number = 0; // Keeps track of the delete count, initialized to 0

  // Deploy the contract and set up some roles before each test
  before(async function () {
    const { contract } = await loadFixture(contractDeployment);
    Contract = contract;
    defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
    senderRole = await contract.SENDER();
    adminRole = await contract.ADMIN();
    owner = await ethers.provider.getSigner(0);
    ownerAddress = await owner.getAddress();
    admin = await ethers.provider.getSigner(1);
    adminAddress = await admin.getAddress();
    firstSender = await ethers.provider.getSigner(2);
    firstSenderAddress = await firstSender.getAddress();
    secondSender = await ethers.provider.getSigner(3);
    secondSenderAddress = await secondSender.getAddress();
    nonSender = await ethers.provider.getSigner(4);
    nonSenderAddress = await nonSender.getAddress();
    await Contract.connect(owner).setAdmin(adminAddress);
    await Contract.connect(admin).setSender(firstSenderAddress);
    await Contract.connect(admin).setSender(secondSenderAddress);
  });
  describe("rolesList()", function () {
    it("should return all role types", async function () {
      const expected = ["DEFAULT_ADMIN_ROLE", "ADMIN", "SENDER"];
      const actual = await Contract.rolesList();
      expect(actual).to.deep.equal(expected);
    });
    it("should revert for non-existing role", async function () {
      const expected = ["DEFAULT_ADMIN_ROLE", "ADMIN", "SENDER", "OWNER"];
      const actual = await Contract.rolesList();
      expect(actual).to.not.deep.equal(expected).to.be.reverted;
    });
  });

  describe("rymediInitialize()", function () {
    const expectedAdminRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("ADMIN")
    );
    const expectedSenderRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("SENDER")
    );

    it("should set up roles correctly", async function () {
      assert(
        await Contract.hasRole(defaultAdminRole, ownerAddress),
        `Default Admin role not assigned to ${ownerAddress}`
      );
      assert(
        await Contract.isOwner(ownerAddress),
        `Owner not assigned to ${ownerAddress}`
      );
      expect(defaultAdminRole).to.equal(ethers.constants.HashZero);
      expect(adminRole).to.equal(expectedAdminRole);
      expect(senderRole).to.equal(expectedSenderRole);
    });
  });

  describe("addRecord()", function () {
    // it("should return an empty array if no records have been added", async () => {
    //   const keys = await Contract.getRecordKeyList();
    //   expect(keys).to.eql([]);
    // });
    it("should add a record when called by a sender", async function () {
      const key = hash("some-key");
      const value = "some-value";

      const tx = await Contract.connect(firstSender).addRecord(key, value);
      await tx.wait(); // wait for the transaction to be mined

      expect(await Contract.getRecord(key)).to.equal(value);
      const receipt = await txReceipt(tx.hash);
      const events = getEvents(Contract, receipt);
      expect(events[0].name).to.equal("AddRecord");
      expect(events[0].args.key).to.equal(key);
      expect(events[0].args.value).to.equal(value);
      messageCount += 1;
    });

    it("should add a Object type record when called by a sender", async function () {
      const key = hash("object-key");

      const obj = { name: "John", age: 30, city: "New York" };
      const value = JSON.stringify(obj);

      const tx = await Contract.connect(firstSender).addRecord(key, value);
      await tx.wait(); // wait for the transaction to be mined

      expect(await Contract.getRecord(key)).to.equal(value);
      const receipt = await txReceipt(tx.hash);
      const events = getEvents(Contract, receipt);
      expect(events[0].name).to.equal("AddRecord");
      expect(events[0].args.key).to.equal(key);
      expect(events[0].args.value).to.equal(value);
      messageCount += 1;
    });
    it("should add a Array type record when called by a sender", async function () {
      const key = hash("array-key");

      const example = ["Banana", "Orange", "Apple", "Mango"];
      const value = example.toString();

      const tx = await Contract.connect(firstSender).addRecord(key, value);
      await tx.wait(); // wait for the transaction to be mined

      expect(await Contract.getRecord(key)).to.equal(value);
      const receipt = await txReceipt(tx.hash);
      const events = getEvents(Contract, receipt);
      expect(events[0].name).to.equal("AddRecord");
      expect(events[0].args.key).to.equal(key);
      expect(events[0].args.value).to.equal(value);
      messageCount += 1;
    });
    it("should add an empty object type record when called by a sender", async function () {
      const key = hash("empty-object-key");

      const obj = {};
      const value = JSON.stringify(obj);

      const tx = await Contract.connect(firstSender).addRecord(key, value);
      await tx.wait(); // wait for the transaction to be mined

      expect(await Contract.getRecord(key)).to.equal(value);
      const receipt = await txReceipt(tx.hash);
      const events = getEvents(Contract, receipt);
      expect(events[0].name).to.equal("AddRecord");
      expect(events[0].args.key).to.equal(key);
      expect(events[0].args.value).to.equal(value);
      messageCount += 1;
    });
    it("should revert for empty string type record when called by a sender", async function () {
      const key = hash("empty-key-key");
      const value = "";
      await expect(Contract.connect(secondSender).addRecord(key, value)).to.be
        .reverted;
    });

    it("should revert for BigInt type while adding record when called by a sender", async function () {
      const key = hash("bigint-object-key");
      const value = BigInt("123456789012345678901234567890");
      await expect(Contract.connect(secondSender).addRecord(key, value)).to.be
        .reverted;
    });

    // it("should return an array of all record keys", async () => {
    //   const key = hash("some-key");
    //   const keys = await Contract.getRecordKeyList();
    //   expect(keys).to.eql([key]);
    // });

    it("should not allow a record with the same key to be added twice", async function () {
      const key = hash("some-key-1");
      const value = "some-value-1";

      await Contract.connect(firstSender).addRecord(key, value);
      await expect(Contract.connect(secondSender).addRecord(key, value)).to.be
        .reverted;
      messageCount += 1;
    });

    it("should not allow a record to be added by a non-sender", async function () {
      const key = hash("some-key-2");
      const value = "some-value-2";
      await expect(Contract.connect(nonSender).addRecord(key, value)).to.be
        .reverted;
    });
    it("should not allow a record to be added by an owner", async function () {
      const key = hash("some-key-2");
      const value = "some-value-2";
      await expect(Contract.connect(owner).addRecord(key, value)).to.be
        .reverted;
    });
    it("should not allow a record to be added by an admin", async function () {
      const key = hash("some-key-2");
      const value = "some-value-2";
      await expect(Contract.connect(admin).addRecord(key, value)).to.be
        .reverted;
    });
  });

  describe("getRecord()", function () {
    it("should return the value of an existing record", async function () {
      const key = hash("some-key-1");
      const value = "some-value-1";
      // Get the value of the record and check that it matches the stored value
      const result = await Contract.getRecord(key);
      expect(result).to.equal(value);
    });

    it("should return zero for a non-existent record", async function () {
      // Try to get the value of a non-existent record
      const key = hash("some-random-key-1");

      const result = await Contract.getRecord(key);
      // Check that the result is empty
      expect(result).to.equal("");
    });
  });

  describe("addBulkRecords()", function () {
    it("should add multiple records", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");

      const value1 = "VALUE_1";
      const value2 = "VALUE_2";

      const keys = [key1, key2];
      const values = [value1, value2];

      const tx = await Contract.connect(secondSender).addBulkRecords(
        keys,
        values
      );
      await tx.wait(); // wait for the transaction to be mined
      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);
      expect(logs[0].name).to.equal("AddRecord");
      expect(logs[0].args.key).to.equal(key1);
      expect(logs[0].args.value).to.equal(value1);
      expect(logs[1].name).to.equal("AddRecord");
      expect(logs[1].args.key).to.equal(key2);
      expect(logs[1].args.value).to.equal(value2);
      expect(await Contract.getRecord(key1)).to.equal(value1);
      expect(await Contract.getRecord(key2)).to.equal(value2);
      messageCount += keys.length;
    });
    it("should add multiple records with different data types values", async function () {
      const key1 = hash("BULK_KEY_1");
      const key2 = hash("BULK_KEY_2");

      const example = ["Banana", "Orange", "Apple", "Mango"];
      const value1 = example.toString();

      const obj = { name: "John", age: 30, city: "New York" };
      const value2 = JSON.stringify(obj);

      const keys = [key1, key2];
      const values = [value1, value2];

      const tx = await Contract.connect(secondSender).addBulkRecords(
        keys,
        values
      );
      await tx.wait(); // wait for the transaction to be mined
      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);
      expect(logs[0].name).to.equal("AddRecord");
      expect(logs[0].args.key).to.equal(key1);
      expect(logs[0].args.value).to.equal(value1);
      expect(logs[1].name).to.equal("AddRecord");
      expect(logs[1].args.key).to.equal(key2);
      expect(logs[1].args.value).to.equal(value2);
      expect(await Contract.getRecord(key1)).to.equal(value1);
      expect(await Contract.getRecord(key2)).to.equal(value2);
      messageCount += keys.length;
    });

    it("should not allow adding records with duplicate keys", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");
      const value1 = "VALUE_1";
      const value2 = "VALUE_2";
      await expect(
        Contract.connect(firstSender).addBulkRecords(
          [key1, key2],
          [value1, value2]
        )
      ).to.be.reverted;
    });

    it("should not allow arrays with different lengths", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");
      const value1 = hash("VALUE_1");
      await expect(
        Contract.connect(secondSender).addBulkRecords([key1, key2], [value1])
      ).to.be.revertedWith("Lengths of keys and values arrays do not match");
    });

    it("should not allow a record to be added by a non-sender", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");
      const value1 = hash("VALUE_1");
      const value2 = hash("VALUE_2");
      await expect(
        Contract.connect(nonSender).addBulkRecords(
          [key1, key2],
          [value1, value2]
        )
      ).to.be.reverted;
    });
    it("should not allow a record to be added by an owner", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");
      const value1 = hash("VALUE_1");
      const value2 = hash("VALUE_2");
      await expect(
        Contract.connect(owner).addBulkRecords([key1, key2], [value1, value2])
      ).to.be.reverted;
    });
    it("should not allow a record to be added by an admin", async function () {
      const key1 = hash("KEY_1");
      const key2 = hash("KEY_2");
      const value1 = hash("VALUE_1");
      const value2 = hash("VALUE_2");
      await expect(
        Contract.connect(admin).addBulkRecords([key1, key2], [value1, value2])
      ).to.be.reverted;
    });
  });

  describe("removeRecord", function () {
    // it("should return an empty array if no records have been deleted", async () => {
    //   const keys = await Contract.getDeletedRecordKeys();
    //   expect(keys).to.eql([]);
    // });

    it("should remove an existing record", async function () {
      const key1 = hash("KEY_1");
      // Call the removeRecord function
      await Contract.connect(admin).removeRecord(key1);
      // Check that the record was removed
      const result = await Contract.getRecord(key1);
      expect(result).to.equal("");
      deleteCount += 1;
    });

    it("should emit a RemoveRecord event", async function () {
      const key1 = hash("KEY_2");
      const value1 = "VALUE_2";

      // Call the removeRecord function
      const tx = await Contract.connect(admin).removeRecord(key1);
      // Check that the RemoveRecord event was emitted with the correct arguments
      const receipt = await txReceipt(tx.hash);
      const logs = await getEvents(Contract, receipt);
      expect(logs[0].name).to.equal("RemoveRecord");
      expect(logs[0].args.key).to.equal(key1);
      expect(logs[0].args.value).to.equal(value1);
      deleteCount += 1;
    });

    // it("should add the record key to the deleted record keys array", async function () {
    //   const key1 = hash("KEY_1");
    //   const key2 = hash("KEY_2");
    //   // Check that the record was added to the deleted records mapping
    //   const result = await Contract.getDeletedRecordKeys();
    //   expect(result).to.deep.equal([key1, key2]);
    // });

    it("should not remove a non-existent record", async function () {
      const nonExistentKey = hash("KEY_229384");
      // Try to remove a non-existent record
      await expect(Contract.connect(admin).removeRecord(nonExistentKey)).to.be
        .reverted;
    });

    it("should only be callable by administrators", async function () {
      const key = hash("KEY_ADMIN_TEST");
      const value = hash("VALUE_ADMIN_TEST");
      await Contract.connect(secondSender).addRecord(key, value);
      // Call the removeRecord function as a non-administrator
      await expect(
        Contract.connect(nonSender).removeRecord(key)
      ).to.be.revertedWith("Restricted to Administrators.");
      await expect(
        Contract.connect(firstSender).removeRecord(key)
      ).to.be.revertedWith("Restricted to Administrators.");
      messageCount += 1;
    });
  });

  describe("recordCount()", function () {
    it("should return the total count of pushed records", async () => {
      const count = await Contract.recordCount();
      expect(count[0]).to.equal(messageCount);
      expect(count[1]).to.equal(deleteCount);
      expect(count[2]).to.equal(messageCount - deleteCount);
    });

    it("should return the correct count after adding records", async () => {
      const key1 = hash("KEY_COUNT_1_TEST");
      const key2 = hash("KEY_COUNT_2_TEST");
      const key3 = hash("KEY_COUNT_3_TEST");
      const value1 = hash("VALUE_COUNT_1_TEST");
      const value2 = hash("VALUE_COUNT_2_TEST");
      const value3 = hash("VALUE_COUNT_3_TEST");

      const res1 = await Contract.connect(secondSender).addRecord(key1, value1);
      const res2 = await Contract.connect(firstSender).addRecord(key2, value2);
      const res3 = await Contract.connect(secondSender).addRecord(key3, value3);
      if (res1.hash && res2.hash && res3.hash) {
        messageCount += 3;
      }
      const count = await Contract.recordCount();

      expect(count[0]).to.equal(messageCount);
      expect(count[1]).to.equal(deleteCount);
      expect(count[2]).to.equal(messageCount - deleteCount);
    });

    it("should return the correct count after deleting records", async () => {
      const key1 = hash("KEY_COUNT_1_TEST");
      const res = await Contract.connect(admin).removeRecord(key1);
      if (res.hash) {
        deleteCount += 1;
      }
      const count = await Contract.recordCount();
      expect(count[0]).to.equal(messageCount);
      expect(count[1]).to.equal(deleteCount);
      expect(count[2]).to.equal(messageCount - deleteCount);
    });
  });

  // describe("getKeyAgainstIndex()", () => {
  //   it("should return the key at the given index", async () => {
  //     const key1 = hash("KEY_INDEX_1_TEST");
  //     const value1 = hash("VALUE_INDEX_1_TEST");
  //     const res = await Contract.connect(
  //       await ethers.provider.getSigner(2)
  //     ).addRecord(key1, value1);
  //     if (res.hash) {
  //       messageCount += 1;
  //     }
  //     const key = await Contract.getKeyAgainstIndex(messageCount - 1);
  //     expect(key).to.equal(key1);
  //   });
  // });

  // describe("getKeyAgainstIndex()", function () {
  //   it("should fetch key against index", async function () {
  //     const expected = hash("some-key");
  //     const actual = await Contract.getKeyAgainstIndex(0);
  //     expect(actual).to.deep.equal(expected);
  //   });
  //   it("should throw error if index is too large", async function () {
  //     await expect(Contract.getKeyAgainstIndex(1000000000000000)).to.be
  //       .reverted;
  //   });
  // });
  // describe("getDeletedKeyAgainstIndex()", function () {
  //   it("should fetch key against index", async function () {
  //     const expected = hash("KEY_1");

  //     const actual = await Contract.getDeletedKeyAgainstIndex(0);
  //     expect(actual).to.deep.equal(expected);
  //   });

  //   it("should throw error if index is too large", async function () {
  //     await expect(Contract.getDeletedKeyAgainstIndex(1000000000000000)).to.be
  //       .reverted;
  //   });
  // });
});
