const { ethers } = require('hardhat');
const { solidity } = require('ethereum-waffle');
const { use, expect, assert } = require('chai');
const chaiAsPromised = require('chai-as-promised');

use(solidity);
use(chaiAsPromised).should();

describe('Stories & StoriesERC20 Test', () => {
  let stories, storiesERC20DeployedAddress, storiesERC20, acc1, acc2, acc3, acc4;

  describe('⚡ 0xStories flow ⚡', async () => {
    it('Stories: Deployment...', async () => {
      [acc1, acc2, acc3, acc4] = await ethers.getSigners();

      const Stories = await ethers.getContractFactory('Stories');
      stories = await Stories.deploy(ethers.utils.parseEther('2'), acc1.address);

      await stories.deployed();
    });

    it('Stories: owner()', async () => {
      expect(await stories.owner()).to.equal(acc1.address);
    });

    it('Stories: getPlatformFee()', async () => {
      expect(await stories.getPlatformFee()).to.equal(ethers.utils.parseEther('2'));
    });

    it('StoriesERC20: deployStoriesERC20Contract()', async () => {
      // error
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), {
          value: ethers.utils.parseEther('1'),
        })
        .should.be.rejectedWith('Pay platform fee.');

      // success
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 1', 'ACC2TKN1', ethers.utils.parseEther('1'), {
          value: ethers.utils.parseEther('2'),
        });

      // error
      await stories
        .connect(acc2)
        .deployStoriesERC20Contract('DID:ACC2', 'ACC2 Token 2', 'ACC2TKN2', ethers.utils.parseEther('5'), {
          value: ethers.utils.parseEther('2'),
        })
        .should.be.rejectedWith('Contract already deployed.');
    });

    it('Stories: getHasDeployed()', async () => {
      expect(await stories.getHasDeployed(acc2.address)).to.equal(true);
    });

    it('Stories: getBalance()', async () => {
      expect(await stories.getBalance()).to.equal(ethers.utils.parseEther('2'));
    });

    it('Stories: getDeployedContractAddress()', async () => {
      storiesERC20DeployedAddress = await stories.getDeployedContractAddress(acc2.address);
    });

    it('Stories: getDeployers()', async () => {
      const deployers = await stories.getDeployers();

      expect(deployers[0].deployerdAddress).to.be.equal(acc2.address);
      expect(deployers[0].deployerDID).to.be.equal('DID:ACC2');
      expect(deployers[0].deployedContractAddress).to.be.equal(storiesERC20DeployedAddress);
    });

    it('Stories: setPlatformFee()', async () => {
      // error
      await stories
        .connect(acc3)
        .setPlatformFee(ethers.utils.parseEther('4'))
        .should.be.rejectedWith('Only owner can execute this.');

      // success
      await stories.connect(acc1).setPlatformFee(ethers.utils.parseEther('4'));

      expect(await stories.getPlatformFee()).to.be.equal(ethers.utils.parseEther('4'));
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

      expect(await stories.getBalance()).to.be.equal(0);
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

    it('StoriesERC20: getBalance()', async () => {
      expect(await storiesERC20.getBalance()).to.be.equal(ethers.utils.parseEther('5'));
    });

    it('StoriesERC20: balanceOf()', async () => {
      expect(await storiesERC20.balanceOf(acc4.address)).to.be.equal(5);
    });

    it('StoriesERC20: totalSupply()', async () => {
      expect(await storiesERC20.totalSupply()).to.be.equal(5);
    });

    it('StoriesERC20: mintForOwner()', async () => {
      // error
      await storiesERC20.connect(acc4).mintForOwner(100).should.be.rejectedWith('Only owner can execute this.');

      // success
      await storiesERC20.connect(acc2).mintForOwner(100);

      expect(await storiesERC20.totalSupply()).to.be.equal(105);
      expect(await storiesERC20.getBalance()).to.be.equal(ethers.utils.parseEther('5'));
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

      expect(await storiesERC20.getBalance()).to.be.equal(0);
    });
  });
});
