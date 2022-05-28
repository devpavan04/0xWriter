//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StoriesERC20.sol";
import "./StoriesOwnable.sol";

contract Stories is StoriesOwnable {
    uint256 private deploymentFee;

    mapping(address => bool) private hasWriterDeployed;
    mapping(address => address) private writerDeployedContractAddress;

    Writer[] private writers;

    struct Writer {
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

    constructor(uint256 _deploymentFee, address _owner) StoriesOwnable(_owner) {
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

    function getWriters() public view returns (Writer[] memory) {
        return writers;
    }

    // setters
    function setDeploymentFee(uint256 _newDeploymentFee) public onlyOwner {
        deploymentFee = _newDeploymentFee;
        emit LogNewDeploymentFee(_newDeploymentFee);
    }

    // main
    function deployStoriesERC20Contract(
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
        StoriesERC20 storiesERC20 = new StoriesERC20(
            _tokenName,
            _tokenSymbol,
            _tokenPrice,
            _initialMintTokenAmount,
            msg.sender
        );
        address deployedContractAddress = address(storiesERC20);
        writers.push(Writer(msg.sender, _did, deployedContractAddress));
        writerDeployedContractAddress[msg.sender] = deployedContractAddress;
        hasWriterDeployed[msg.sender] = true;
        emit LogNewDeployment(msg.sender, _did, deployedContractAddress);
    }
}
