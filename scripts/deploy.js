const hre = require('hardhat');

async function main() {
  const deployer = await hre.ethers.getSigner();
  const deployerAddress = await deployer.getAddress();
  const Stories = await hre.ethers.getContractFactory('Stories');
  const stories = await Stories.deploy(hre.ethers.utils.parseEther('1'), deployerAddress);

  await stories.deployed();

  console.log('Stories deployed to:', stories.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
