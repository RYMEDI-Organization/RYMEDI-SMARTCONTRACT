pragma solidity 0.8.19;

contract Proxy {

    // Code position in storage is keccak256("_contractName") = "hash"
    bytes32 contractAddressLoad;
    address contractLogic;

    constructor(string _contractName, bytes memory _constructData, address _contractLogic) {
        
        // save the code address
        contractAddress = keccak256(abi.encodePacked(_contractName));
        contractLogic = _contractLogic;

        assembly {
            // solium-disable-line
            sstore(
                contractAddressLoad,
                _contractLogic
            )
        }
        (bool success, bytes memory result) = contractLogic.delegatecall(
            constructData
        ); // solium-disable-line
        require(success, "Construction failed");
    }

    fallback() external payable {
            assembly {
                // solium-disable-line
                let contractLogic := sload(contractAddressLoad)
                calldatacopy(0x0, 0x0, calldatasize())
                let success := delegatecall(
                    sub(gas(), 10000),
                    contractLogic,
                    0x0,
                    calldatasize(),
                    0,
                    0
                )
                let retSz := returndatasize()
                returndatacopy(0, 0, retSz)
                switch success
                case 0 {
                    revert(0, retSz)
                }
                default {
                    return(0, retSz)
                }
            }
        }
}
