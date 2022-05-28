const { ethers } = require('hardhat');
const { solidity } = require('ethereum-waffle');
const { use, expect, assert } = require('chai');
const chaiAsPromised = require('chai-as-promised');

use(solidity);
use(chaiAsPromised).should();

describe('0xStories Contracts Test', () => {
  let stories, storiesERC20DeployedAddress, storiesERC20, acc1, acc2, acc3, acc4;

  describe('Testing Stories, StoriesERC20 & StoriesOwnable contracts...', async () => {
    it('Stories: Deployment...', async () => {
      [acc1, acc2, acc3, acc4] = await ethers.getSigners();

      const Stories = await ethers.getContractFactory('Stories');
      stories = await Stories.deploy(ethers.utils.parseEther('2'), acc1.address);

      await stories.deployed();
    });

    it('Stories: owner()', async () => {
      expect(await stories.owner()).to.equal(acc1.address);
    });

    it('Stories: getDeploymentFee()', async () => {
      expect(await stories.getDeploymentFee()).to.equal(ethers.utils.parseEther('2'));
    });

    it('StoriesERC20: deployStoriesERC20Contract()', async () => {
      // error
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), 50, {
          value: ethers.utils.parseEther('1'),
        })
        .should.be.rejectedWith('Pay deployment fee.');

      // success
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), 50, {
          value: ethers.utils.parseEther('2'),
        });

      // error
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 2', 'ACC2TKN2', ethers.utils.parseEther('5'), 50, {
          value: ethers.utils.parseEther('2'),
        })
        .should.be.rejectedWith('Contract already deployed by this address.');
    });

    it('Stories: getHasWriterDeployed()', async () => {
      expect(await stories.getHasWriterDeployed(acc2.address)).to.equal(true);
    });

    it('Stories: getContractBalance()', async () => {
      expect(await stories.getContractBalance()).to.equal(ethers.utils.parseEther('2'));
    });

    it('Stories: getWriterDeployedContractAddress()', async () => {
      storiesERC20DeployedAddress = await stories.getWriterDeployedContractAddress(acc2.address);
    });

    it('Stories: getWriters()', async () => {
      const writers = await stories.getWriters();

      expect(writers[0].writerAddress).to.be.equal(acc2.address);
      expect(writers[0].writerDID).to.be.equal('DID:ACC2');
      expect(writers[0].writerDeployedContractAddress).to.be.equal(storiesERC20DeployedAddress);
    });

    it('Stories: setDeploymentFee()', async () => {
      // error
      await stories
        .connect(acc3)
        .setDeploymentFee(ethers.utils.parseEther('4'))
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await stories.connect(acc1).setDeploymentFee(ethers.utils.parseEther('4'));

      expect(await stories.getDeploymentFee()).to.be.equal(ethers.utils.parseEther('4'));
    });

    it('Stories: transferOwnership()', async () => {
      // error
      await stories
        .connect(acc3)
        .transferOwnership(acc2.address)
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await stories.connect(acc1).transferOwnership(acc2.address);

      expect(await stories.owner()).to.be.equal(acc2.address);
    });

    it('Stories: withdrawBalance()', async () => {
      // error
      await stories.connect(acc1).withdrawBalance().should.be.rejectedWith('Only owner can execute this.');

      // success
      await stories.connect(acc2).withdrawBalance();

      expect(await stories.getContractBalance()).to.be.equal(0);
    });

    it('StoriesERC20: Create an instance of StoriesERC20 contract deployed by acc2 through Stories contract ...', async () => {
      storiesERC20 = await ethers.getContractAt('StoriesERC20', storiesERC20DeployedAddress);
    });

    // 'DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1'
    it('StoriesERC20: name()', async () => {
      expect(await storiesERC20.name()).to.be.equal('ACC2 Token 1');
    });

    it('StoriesERC20: symbol()', async () => {
      expect(await storiesERC20.symbol()).to.be.equal('ACC2TKN1');
    });

    it('StoriesERC20: getTokenPrice()', async () => {
      expect(await storiesERC20.getTokenPrice()).to.be.equal(ethers.utils.parseEther('1'));
    });

    it('StoriesERC20: mint()', async () => {
      // error
      await storiesERC20
        .connect(acc4)
        .mint(5, { value: ethers.utils.parseEther('4') })
        .should.be.rejectedWith('Should pay the total token price.');

      // success
      await storiesERC20.connect(acc4).mint(5, { value: ethers.utils.parseEther('5') });
    });

    it('StoriesERC20: getContractBalance()', async () => {
      expect(await storiesERC20.getContractBalance()).to.be.equal(ethers.utils.parseEther('5'));
    });

    it('StoriesERC20: balanceOf()', async () => {
      expect(await storiesERC20.balanceOf(acc2.address)).to.be.equal(50);
      expect(await storiesERC20.balanceOf(acc4.address)).to.be.equal(5);
    });

    it('StoriesERC20: totalSupply()', async () => {
      expect(await storiesERC20.totalSupply()).to.be.equal(55);
    });

    it('StoriesERC20: setTokenPrice()', async () => {
      // error
      await storiesERC20
        .connect(acc1)
        .setTokenPrice(ethers.utils.parseEther('2'))
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await storiesERC20.connect(acc2).setTokenPrice(ethers.utils.parseEther('2'));

      expect(await storiesERC20.getTokenPrice()).to.be.equal(ethers.utils.parseEther('2'));
    });

    it('StoriesERC20: transferOwnership()', async () => {
      // error
      await storiesERC20
        .connect(acc1)
        .transferOwnership(acc4.address)
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await storiesERC20.connect(acc2).transferOwnership(acc4.address);

      expect(await storiesERC20.owner()).to.be.equal(acc4.address);
    });

    it('StoriesERC20: withdrawBalance()', async () => {
      // error
      await storiesERC20.connect(acc2).withdrawBalance().should.be.rejectedWith('Only owner can execute this.');

      // success
      await storiesERC20.connect(acc4).withdrawBalance();

      expect(await storiesERC20.getContractBalance()).to.be.equal(0);
    });
  });
});
