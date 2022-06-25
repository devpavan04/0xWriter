// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./WriterOwnable.sol";

contract WriterERC20 is ERC20, WriterOwnable {
    uint256 private tokenPrice;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _tokenPrice,
        uint256 _initialMintTokenAmount,
        address _owner
    ) ERC20(_tokenName, _tokenSymbol) WriterOwnable(_owner) {
        tokenPrice = _tokenPrice;
        _mint(_owner, _initialMintTokenAmount);
    }

    receive() external payable {}

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    function setTokenPrice(uint256 _newTokenPrice) public onlyOwner {
        tokenPrice = _newTokenPrice;
    }

    function mint(uint256 _amount) public payable {
        uint256 totalTokenPrice = tokenPrice * _amount;
        require(
            msg.value == totalTokenPrice,
            "Should pay the total token price."
        );
        _mint(msg.sender, _amount);
    }
}
