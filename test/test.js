const { ethers } = require('hardhat');
const { solidity } = require('ethereum-waffle');
const { use, expect, assert } = require('chai');
const chaiAsPromised = require('chai-as-promised');

use(solidity);
use(chaiAsPromised).should();

describe('0xWriter Contracts Test', () => {
  let writer, writerERC20DeployedAddress, writerERC20, acc1, acc2, acc3, acc4;

  describe('Testing Writer, WriterERC20 & WriterOwnable contracts...', async () => {
    it('Writer: Deployment...', async () => {
      [acc1, acc2, acc3, acc4] = await ethers.getSigners();

      const Writer = await ethers.getContractFactory('Writer');
      writer = await Writer.deploy(ethers.utils.parseEther('2'), acc1.address);

      await writer.deployed();
    });

    it('Writer: owner()', async () => {
      expect(await writer.owner()).to.equal(acc1.address);
    });

    it('Writer: getDeploymentFee()', async () => {
      expect(await writer.getDeploymentFee()).to.equal(ethers.utils.parseEther('2'));
    });

    it('Writer: deployWriterERC20Contract()', async () => {
      // error
      await writer
        .connect(acc2)
        .deployWriterERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), 50, {
          value: ethers.utils.parseEther('1'),
        })
        .should.be.rejectedWith('Pay deployment fee.');

      // success
      await writer
        .connect(acc2)
        .deployWriterERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), 50, {
          value: ethers.utils.parseEther('2'),
        });

      // error
      await writer
        .connect(acc2)
        .deployWriterERC20Contract('DID:ACC2', 'ACC2 Token 2', 'ACC2TKN2', ethers.utils.parseEther('5'), 50, {
          value: ethers.utils.parseEther('2'),
        })
        .should.be.rejectedWith('Contract already deployed by this address.');
    });

    it('Writer: getHasWriterDeployed()', async () => {
      expect(await writer.getHasWriterDeployed(acc2.address)).to.equal(true);
    });

    it('Writer: getContractBalance()', async () => {
      expect(await writer.getContractBalance()).to.equal(ethers.utils.parseEther('2'));
    });

    it('Writer: getWriterDeployedContractAddress()', async () => {
      writerERC20DeployedAddress = await writer.getWriterDeployedContractAddress(acc2.address);
    });

    it('Writer: getWriters()', async () => {
      const writers = await writer.getWriters();

      expect(writers[0].writerAddress).to.be.equal(acc2.address);
      expect(writers[0].writerDID).to.be.equal('DID:ACC2');
      expect(writers[0].writerDeployedContractAddress).to.be.equal(writerERC20DeployedAddress);
    });

    it('Writer: setDeploymentFee()', async () => {
      // error
      await writer
        .connect(acc3)
        .setDeploymentFee(ethers.utils.parseEther('4'))
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await writer.connect(acc1).setDeploymentFee(ethers.utils.parseEther('4'));

      expect(await writer.getDeploymentFee()).to.be.equal(ethers.utils.parseEther('4'));
    });

    it('Writer: transferOwnership()', async () => {
      // error
      await writer.connect(acc3).transferOwnership(acc2.address).should.be.rejectedWith('Only owner can execute this.');

      // success
      await writer.connect(acc1).transferOwnership(acc2.address);

      expect(await writer.owner()).to.be.equal(acc2.address);
    });

    it('Writer: withdrawBalance()', async () => {
      // error
      await writer.connect(acc1).withdrawBalance().should.be.rejectedWith('Only owner can execute this.');

      // success
      await writer.connect(acc2).withdrawBalance();

      expect(await writer.getContractBalance()).to.be.equal(0);
    });

    it('WriterERC20: Create an instance of WriterERC20 contract deployed by acc2 through Writer contract ...', async () => {
      writerERC20 = await ethers.getContractAt('WriterERC20', writerERC20DeployedAddress);
    });

    // 'DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1'
    it('WriterERC20: name()', async () => {
      expect(await writerERC20.name()).to.be.equal('ACC2 Token 1');
    });

    it('WriterERC20: symbol()', async () => {
      expect(await writerERC20.symbol()).to.be.equal('ACC2TKN1');
    });

    it('WriterERC20: getTokenPrice()', async () => {
      expect(await writerERC20.getTokenPrice()).to.be.equal(ethers.utils.parseEther('1'));
    });

    it('WriterERC20: mint()', async () => {
      // error
      await writerERC20
        .connect(acc4)
        .mint(5, { value: ethers.utils.parseEther('4') })
        .should.be.rejectedWith('Should pay the total token price.');

      // success
      await writerERC20.connect(acc4).mint(5, { value: ethers.utils.parseEther('5') });
    });

    it('WriterERC20: getContractBalance()', async () => {
      expect(await writerERC20.getContractBalance()).to.be.equal(ethers.utils.parseEther('5'));
    });

    it('WriterERC20: balanceOf()', async () => {
      expect(await writerERC20.balanceOf(acc2.address)).to.be.equal(50);
      expect(await writerERC20.balanceOf(acc4.address)).to.be.equal(5);
    });

    it('WriterERC20: totalSupply()', async () => {
      expect(await writerERC20.totalSupply()).to.be.equal(55);
    });

    it('WriterERC20: setTokenPrice()', async () => {
      // error
      await writerERC20
        .connect(acc1)
        .setTokenPrice(ethers.utils.parseEther('2'))
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await writerERC20.connect(acc2).setTokenPrice(ethers.utils.parseEther('2'));

      expect(await writerERC20.getTokenPrice()).to.be.equal(ethers.utils.parseEther('2'));
    });

    it('WriterERC20: transferOwnership()', async () => {
      // error
      await writerERC20
        .connect(acc1)
        .transferOwnership(acc4.address)
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await writerERC20.connect(acc2).transferOwnership(acc4.address);

      expect(await writerERC20.owner()).to.be.equal(acc4.address);
    });

    it('WriterERC20: withdrawBalance()', async () => {
      // error
      await writerERC20.connect(acc2).withdrawBalance().should.be.rejectedWith('Only owner can execute this.');

      // success
      await writerERC20.connect(acc4).withdrawBalance();

      expect(await writerERC20.getContractBalance()).to.be.equal(0);
    });
  });
});
