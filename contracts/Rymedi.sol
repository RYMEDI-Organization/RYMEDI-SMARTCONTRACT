// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.19;
import "./Proxiable.sol";

/**
 * @title Rymedi logic contract for Data storage
 * @author Mayank Saxena (@forkblocks)
 * @notice Use this contract to wite data to Proxy contract
 */
contract Rymedi is Proxiable, AccessControl, LibraryLock {
    /// @dev variables
    mapping(bytes32 => bytes32) records;
    mapping(bytes32 => bytes32) deletedRecords;
    bytes32[] recordKeyList;
    bytes32[] deletedRecordKeys;
    string[] roles;

    /// @dev Owner - DEFAULT_ADMIN_ROLE + user roles
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant SENDER = keccak256("SENDER");

    /// @dev events
    event AddRecord(bytes32 indexed key, bytes32 indexed value);
    event RemoveRecord(bytes32 indexed key, bytes32 indexed value);

    // ========================================= Manage Rymedi Data =======================================================================

    /*
     * we will calculate the sha3 of the rymediInitialize() and we will pass the hash while deploying the proxy contract.
     * This is like our constructor function.
     * We are telling our proxy contract to call this function as contructor.
     */
    function rymediInitialize() public {
        require(!initialized, "Already initalized");
        initialize();
        roles.push("DEFAULT_ADMIN_ROLE");
        roles.push("ADMIN");
        roles.push("SENDER");
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(SENDER, ADMIN);
    }

    /**
     * @notice Push single record - Only SENDER
     * @param key bytes32 - sha256 hash
     * @param value bytes32 - sha256 hash
     */
    function addRecord(
        bytes32 key,
        bytes32 value
    ) public onlyRole(SENDER) delegatedOnly returns (bool) {
        require(records[key] == 0, "Record's Key already exist");
        records[key] = value;
        recordKeyList.push(key);
        emit AddRecord(key, value);
        return true;
    }
}
