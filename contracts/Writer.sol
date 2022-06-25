//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./WriterERC20.sol";
import "./WriterOwnable.sol";

/// @title 0xWriter DApp's main contract on polygon testnet
/// @notice This contract implements the public interface for a writer to deploy an ERC20 contract to create a token gated access of their content
contract Writer is WriterOwnable {
    /// Deployment fee that will be paid by the writer to deploy a contract
    uint256 private deploymentFee;

    /// Returns true if the writer has already deployed a contract
    mapping(address => bool) private hasWriterDeployed;

    /// Returns the address of the contract deployed by the writer
    mapping(address => address) private writerDeployedContractAddress;

    /// List of all the writers who has depolyed their contract
    Writerr[] private writers;

    /// @notice Defines a writer by their wallet address, decentralized identity id(DID) and the address of the contract they deployed
    struct Writerr {
        address writerAddress;
        string writerDID;
        address writerDeployedContractAddress;
    }

    /// @notice Logs the deployment fee every time it is updated by the owner
    event LogNewDeploymentFee(uint256 indexed newDeploymentFee);

    /// @notice Logs the deployment details containing wallet address of the writer, their decentralized identity id(DID) and the address of the contract they deployed. Logged everytime a new contract is deployed from this contract
    event LogNewDeployment(
        address indexed writerAddress,
        string indexed writerDID,
        address indexed writerDeployedContractAddress
    );

    /// @dev Required to receive funds to this contract
    receive() external payable {}

    /// @notice Contructor sets the initial deployment fee and the address of the owner(deployer)
    /// @param _deploymentFee - fee that will be paid by the writer to deploy a contract
    /// @param _owner - address of the owner(deployer)
    constructor(uint256 _deploymentFee, address _owner) WriterOwnable(_owner) {
        deploymentFee = _deploymentFee;
    }

    /// @notice Get the balance of this contract
    /// @return Balance of this contract
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get the deployment fee
    /// @return Deployment fee that will be paid by the writer to deploy a contract
    function getDeploymentFee() public view returns (uint256) {
        return deploymentFee;
    }

    /// @notice Check if a writer has deployed a contract or not
    /// @return True if the writer has deployed else returns false
    function getHasWriterDeployed(address _address) public view returns (bool) {
        require(_address != address(0), "Invalid address.");
        return hasWriterDeployed[_address];
    }

    /// @notice Get the address of the contract deployed by the writer
    /// @return Address of the contract deployed by the writer
    function getWriterDeployedContractAddress(address _address)
        public
        view
        returns (address)
    {
        require(_address != address(0), "Invalid address.");
        return writerDeployedContractAddress[_address];
    }

    /// @notice Get the list of all the writers who has deployed a contract
    /// @return List of all the writers who has deployed a contract
    function getWriters() public view returns (Writerr[] memory) {
        return writers;
    }

    /// @notice Update the deployment fee - can be called only by the owner
    function setDeploymentFee(uint256 _newDeploymentFee) public onlyOwner {
        deploymentFee = _newDeploymentFee;
        emit LogNewDeploymentFee(_newDeploymentFee);
    }

    /// @notice Deploy an ERC20 contract to create a token gated access to your content on 0xWriter DApp
    /// @param _did - decentralized identity id(DID) of the writer
    /// @param _tokenName - token name
    /// @param _tokenSymbol - token symbol
    /// @param _tokenPrice - token price
    /// @param _initialMintTokenAmount - number of tokens to mint on deploy
    function deployWriterERC20Contract(
        string memory _did,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _tokenPrice,
        uint256 _initialMintTokenAmount
    ) public payable {
        require(msg.sender != address(0), "Invalid address.");
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
