const { ethers } = require("hardhat");
import { Contract } from "ethers";
import { providers } from "ethers";
import CryptoJS from "crypto-js";

/**
 * Fetches the transaction receipt for a given hash.
 * @param hash - The transaction hash.
 * @returns A Promise that resolves to the transaction receipt.
 */
export const txReceipt = async (hash: string) => {
  const receipt = await ethers.provider.getTransactionReceipt(hash);
  return receipt;
};

/**
 * Calculates the SHA256 hash of a given value.
 * @param value - The value to be hashed.
 * @returns The hashed value prefixed with "0x".
 */
export function hash(value: string) {
  return "0x" + CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}
/**
 * Retrieves events from a transaction receipt.
 * @param Contract The contract instance.
 * @param receipt The transaction receipt object.
 * @returns An array of parsed events from the receipt logs.
 */
export function getEvents(
  Contract: Contract,
  receipt: providers.TransactionReceipt
) {
  const events = receipt.logs.map((log: providers.Log) =>
    Contract.interface.parseLog(log)
  );
  return events;
}
