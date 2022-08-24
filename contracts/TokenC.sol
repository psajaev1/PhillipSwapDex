//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.9;
import "@rari-capital/solmate/src/tokens/ERC20.sol";


// We import this library to be able to use console.log
import "hardhat/console.sol";


// This is the main building block for smart contracts.
contract TokenC is ERC20 {

    /**
     * Contract initialization.
     */
    constructor() ERC20("Char Token", "CCC", 18){
        _mint(msg.sender, 100000);
    }

}
