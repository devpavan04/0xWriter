//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract WriterOwnable {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this.");
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address.");
        owner = _newOwner;
    }

    function withdrawBalance() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw.");
        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "Failed to send Ether");
    }
}
