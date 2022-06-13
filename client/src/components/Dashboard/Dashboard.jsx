import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Identicon from 'react-identicons';
import contractABI from '../../contracts/abi.json';
import './dashboard.css';
import { Button, Spinner, Spacer, Table, Link, Description, Input, Snippet } from '@geist-ui/core';

export const Dashboard = ({ wallet, writer, handleMessage }) => {
  const [owner, setOwner] = useState('');
  const [userIsOwner, setUserIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState('');
  const [deploymentFee, setDeploymentFee] = useState('');
  const [writers, setWriters] = useState([]);
  const [getterAddress, setGetterAddress] = useState('');
  const [newDeploymentFee, setNewDeploymentFee] = useState('');
  const [deployedContractAddress, setDeployedContractAddress] = useState('');
  const [withdrawBtnLoading, setWithdrawBtnLoading] = useState(false);
  const [getAddressBtnLoading, setGetAddressBtnLoading] = useState(false);
  const [changeDeploymentFeeBtnLoading, setChangeDeploymentFeeBtnLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const owner = await writer.owner();
        setOwner(owner);
        if (owner === wallet.address) setUserIsOwner(true);
        const contractBalance = await writer.getContractBalance();
        setContractBalance(ethers.utils.formatEther(contractBalance));
        const deploymentFee = await writer.getDeploymentFee();
        setDeploymentFee(ethers.utils.formatEther(deploymentFee));

        let writers = await writer.getWriters();
        writers = await Promise.all(
          writers.map(async (writer) => {
            const writerERC20 = new ethers.Contract(
              writer.writerDeployedContractAddress,
              contractABI.writerERC20,
              wallet.injectedProvider
            );
            return Object.assign({}, writer, {
              tokenName: await writerERC20.name(),
              tokenSymbol: await writerERC20.symbol(),
              tokenPrice: ethers.utils.formatEther(await writerERC20.getTokenPrice()) + ' MATIC',
            });
          })
        );
        setWriters(writers);
      }
    }
    init();
  }, [writer]);

  const withdrawBalance = async () => {
    try {
      setWithdrawBtnLoading(true);

      const txn = await writer.withdrawBalance();

      const receipt = await txn.wait();

      if (receipt.status === 1) {
        setWithdrawBtnLoading(false);
        handleMessage('success', 'Transaction successful!');
      } else {
        setWithdrawBtnLoading(false);
        handleMessage('error', 'Transaction failed!');
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.log(e);

      setWithdrawBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const getDeployedContractAddress = async () => {
    try {
      if (!getterAddress) {
        handleMessage('warning', 'Please enter writer address.');
      } else if (!ethers.utils.isAddress(getterAddress)) {
        handleMessage('warning', 'Please enter valid address.');
      } else {
        const hasDeployed = await writer.getHasWriterDeployed(getterAddress);

        if (!hasDeployed) {
          handleMessage('warning', 'No contract deployed by this address.');
        } else {
          setGetAddressBtnLoading(true);

          setDeployedContractAddress('');

          const deployedContractAddress = await writer.getWriterDeployedContractAddress(getterAddress);
          setDeployedContractAddress(deployedContractAddress);

          setGetAddressBtnLoading(false);
          setGetterAddress('');
        }
      }
    } catch (e) {
      console.log(e);

      setGetAddressBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const changeDeploymentFee = async () => {
    try {
      if (!newDeploymentFee) {
        handleMessage('warning', 'Please enter new deployment fee.');
      } else {
        setChangeDeploymentFeeBtnLoading(true);

        const txn = await writer.setDeploymentFee(ethers.utils.parseEther(newDeploymentFee));

        const receipt = await txn.wait();

        if (receipt.status === 1) {
          setChangeDeploymentFeeBtnLoading(false);
          handleMessage('success', 'Transaction successful!');
        } else {
          setChangeDeploymentFeeBtnLoading(false);
          handleMessage('error', 'Transaction failed!');
        }

        setNewDeploymentFee('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setChangeDeploymentFeeBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const renderAddress = (value) => {
    return (
      <div className='writers-address-identicon'>
        <Identicon string={value} size='20' />
        {value.substr(0, 10) + '....' + value.slice(value.length - 8)}
      </div>
    );
  };

  const renderDID = (value) => {
    return <>{value.substr(0, 10) + '....' + value.slice(value.length - 8)}</>;
  };

  const renderContractAddress = (value) => {
    return (
      <Link href={`https://mumbai.polygonscan.com/address/${value}`} target={'_blank'} icon>
        Polygonscan
      </Link>
    );
  };

  return (
    <div className='dashboard-content'>
      <div className='dashboard-reads'>
        <div className='address-identicon'>
          {!owner ? <Spinner /> : <Identicon string={owner} size='40' />}
          <Spacer />
          <Description
            title={owner && owner === wallet.address ? 'Owner (You)' : 'Owner'}
            content={!owner ? <Spinner /> : owner.substr(0, 12) + '....' + owner.slice(owner.length - 12)}
          />
        </div>
        <div className='contract-balance-and-withdraw'>
          <Description title='Contract Balance' content={!contractBalance ? <Spinner /> : contractBalance + ' MATIC'} />
          {userIsOwner ? (
            <>
              {withdrawBtnLoading ? (
                <Button type='secondary' marginTop='1rem' shadow loading auto scale={0.8}>
                  Widthdraw Balance
                </Button>
              ) : (
                <Button type='secondary' marginTop='1rem' shadow auto scale={0.8} onClick={withdrawBalance}>
                  Widthdraw Balance
                </Button>
              )}
            </>
          ) : null}
        </div>
        <Description title='Deployment Fee' content={!deploymentFee ? <Spinner /> : deploymentFee + ' MATIC'} />
        <div className='dashboard-read'>
          <Input
            clearable
            onClearClick={() => setDeployedContractAddress('')}
            type='secondary'
            placeholder='Writer Address: 0x0'
            onChange={(e) => setGetterAddress(e.target.value)}
            width='80%'
          >
            Get Deployed Contract Address
          </Input>
          {getAddressBtnLoading ? (
            <Button type='secondary' shadow loading auto scale={0.8}>
              Get Contract Address
            </Button>
          ) : (
            <Button type='secondary' shadow auto scale={0.8} onClick={getDeployedContractAddress}>
              Get Contract Address
            </Button>
          )}
          {!deployedContractAddress ? null : (
            <Snippet type='secondary' symbol='' text={deployedContractAddress} width='300px' />
          )}
        </div>
      </div>
      <div className='dashboard-writes'>
        {userIsOwner ? (
          <div className='dashboard-write'>
            <Input
              clearable
              type='secondary'
              placeholder='Deployment Fee: 0.006'
              onChange={(e) => setNewDeploymentFee(e.target.value)}
              width='80%'
            >
              Change Deployment Fee (MATIC)
            </Input>
            {changeDeploymentFeeBtnLoading ? (
              <Button type='secondary' shadow loading auto scale={0.8}>
                Change Fee
              </Button>
            ) : (
              <Button type='secondary' shadow auto scale={0.8} onClick={changeDeploymentFee}>
                Change Fee
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {/* <div className='dashboard-deployers'>
        <Description
          title='Writers'
          content={
            writers.length < 1 ? (
              <Spinner />
            ) : (
              <Table data={writers} marginTop='0.6'>
                <Table.Column prop='writerAddress' label='Address' render={renderAddress} />
                <Table.Column prop='writerDID' label='DID' render={renderDID} />
                <Table.Column prop='tokenName' label='Name' />
                <Table.Column prop='tokenSymbol' label='Symbol' />
                <Table.Column prop='tokenPrice' label='Price' />
                <Table.Column prop='writerDeployedContractAddress' label='Contract' render={renderContractAddress} />
              </Table>
            )
          }
        />
      </div> */}
    </div>
  );
};
