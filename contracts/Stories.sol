//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StoriesERC20.sol";
import "./StoriesOwnable.sol";

contract Stories is StoriesOwnable {
    uint256 private platformFee;

    mapping(address => bool) private hasDeployed;
    mapping(address => address) private deployedContractAddress;

    Deployer[] private deployers;

    struct Deployer {
        address deployerdAddress;
        string deployerDID;
        address deployedContractAddress;
    }

    event LogNewPlatformFee(uint256 indexed newPlatformFee);
    event LogNewDeployment(
        address indexed deployerdAddress,
        string indexed deployerDID,
        address indexed deployedContractAddress
    );

    receive() external payable {}

    constructor(uint256 _platformFee, address _owner) StoriesOwnable(_owner) {
        platformFee = _platformFee;
    }

    // getters
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getPlatformFee() public view returns (uint256) {
        return platformFee;
    }

    function getHasDeployed(address _address) public view returns (bool) {
        return hasDeployed[_address];
    }

    function getDeployedContractAddress(address _address)
        public
        view
        returns (address)
    {
        return deployedContractAddress[_address];
    }

    function getDeployers() public view returns (Deployer[] memory) {
        return deployers;
    }

    // setters
    function setPlatformFee(uint256 _newPlatformFee) public onlyOwner {
        platformFee = _newPlatformFee;
        emit LogNewPlatformFee(_newPlatformFee);
    }

    // main
    function deployStoriesERC20Contract(
        string memory _did,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _tokenPrice
    ) public payable {
        require(hasDeployed[msg.sender] == false, "Contract already deployed.");
        require(msg.value == platformFee, "Pay platform fee.");
        StoriesERC20 storiesERC20 = new StoriesERC20(
            _tokenName,
            _tokenSymbol,
            _tokenPrice,
            msg.sender
        );
        address contractAddress = address(storiesERC20);
        deployers.push(Deployer(msg.sender, _did, contractAddress));
        deployedContractAddress[msg.sender] = contractAddress;
        hasDeployed[msg.sender] = true;
        emit LogNewDeployment(msg.sender, _did, contractAddress);
    }
}
