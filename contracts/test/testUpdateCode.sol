//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;
import "../Proxiable.sol";

contract RecordKeeper is Proxiable {
    address public owner;
    mapping(bytes32 => bytes32) records;
    bool public initalized = false;

    /*
     * we will calculate the sha3 of the initialize() and we will pass the hash while deploying the proxy contract.
     * This is like our constructor function.
     * We are telling our proxy contract to call this function as contructor.
     */
    function initialize() public {
        require(owner == address(0), "Already initalized");
        require(!initalized, "Already initalized");
        owner = msg.sender;
        initalized = true;
    }

    /*
     * add record.
     */
    function addRecord(bytes32 key, bytes32 value) public {
        records[key] = value;
    }

    /*
     * add records in bulk.
     * throw err, if keys length is not equal to values length.
     */
    function addBulkRecords(
        bytes32[] memory keys,
        bytes32[] memory values
    ) public {
        require(
            keys.length == values.length,
            "Lengths of keys and values arrays do not match"
        );
        for (uint i = 0; i < keys.length; i++) {
            records[keys[i]] = values[i];
        }
    }

    /*
     * get the record by passing the key.
     */
    function getRecord(bytes32 key) public view returns (bytes32) {
        return records[key];
    }

    /*
     * update the address of new smart contract.
     * can only be done by admin.
     * calling the updateCodeAddress of Proxiable contract.
     */
    function updateCode(address newCode, address sender) public onlyOwner {
        updateCodeAddress(newCode, sender);
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner is allowed to perform this action"
        );
        _;
    }
}
