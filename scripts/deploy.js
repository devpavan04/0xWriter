const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying: Writer...');

  const deployer = await hre.ethers.getSigner();
  const deployerAddress = await deployer.getAddress();

  const Writer = await hre.ethers.getContractFactory('Writer');
  const writer = await Writer.deploy(hre.ethers.utils.parseEther('0.001'), deployerAddress);

  await writer.deployed();

  const writerArtifact = await hre.artifacts.readArtifact('Writer');
  const writerERC20Artifact = await hre.artifacts.readArtifact('WriterERC20');

  fs.mkdir('client/src/contracts', { recursive: true }, (err) => {
    if (err) throw err;
  });

  fs.writeFileSync(
    'client/src/contracts/abi.json',
    JSON.stringify({ writer: writerArtifact.abi, writerERC20: writerERC20Artifact.abi })
  );

  fs.writeFileSync('client/src/contracts/address.json', JSON.stringify({ writer: writer.address }));

  console.log('Artifacts saved to: /artifacts AND /client/src/contracts');

  console.log('Writer deployed to:', writer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
