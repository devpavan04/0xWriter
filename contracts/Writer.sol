//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./WriterERC20.sol";
import "./WriterOwnable.sol";

contract Writer is WriterOwnable {
    uint256 private deploymentFee;

    mapping(address => bool) private hasWriterDeployed;
    mapping(address => address) private writerDeployedContractAddress;

    Writerr[] private writers;

    struct Writerr {
        address writerAddress;
        string writerDID;
        address writerDeployedContractAddress;
    }

    event LogNewDeploymentFee(uint256 indexed newDeploymentFee);
    event LogNewDeployment(
        address indexed writerAddress,
        string indexed writerDID,
        address indexed writerDeployedContractAddress
    );

    receive() external payable {}

    constructor(uint256 _deploymentFee, address _owner) WriterOwnable(_owner) {
        deploymentFee = _deploymentFee;
    }

    // getters
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getDeploymentFee() public view returns (uint256) {
        return deploymentFee;
    }

    function getHasWriterDeployed(address _address) public view returns (bool) {
        return hasWriterDeployed[_address];
    }

    function getWriterDeployedContractAddress(address _address)
        public
        view
        returns (address)
    {
        return writerDeployedContractAddress[_address];
    }

    function getWriters() public view returns (Writerr[] memory) {
        return writers;
    }

    // setters
    function setDeploymentFee(uint256 _newDeploymentFee) public onlyOwner {
        deploymentFee = _newDeploymentFee;
        emit LogNewDeploymentFee(_newDeploymentFee);
    }

    // main
    function deployWriterERC20Contract(
        string memory _did,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _tokenPrice,
        uint256 _initialMintTokenAmount
    ) public payable {
        require(
            hasWriterDeployed[msg.sender] == false,
            "Contract already deployed by this address."
        );
        require(msg.value == deploymentFee, "Pay deployment fee.");
        WriterERC20 writerERC20 = new WriterERC20(
            _tokenName,
            _tokenSymbol,
            _tokenPrice,
            _initialMintTokenAmount,
            msg.sender
        );
        address deployedContractAddress = address(writerERC20);
        writers.push(Writerr(msg.sender, _did, deployedContractAddress));
        writerDeployedContractAddress[msg.sender] = deployedContractAddress;
        hasWriterDeployed[msg.sender] = true;
        emit LogNewDeployment(msg.sender, _did, deployedContractAddress);
    }
}
