import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Identicon from 'react-identicons';
import { getUserByAddress } from '../../lib/threadDB';
import './style.css';
import { Button, Spinner, Card, Text, Description, Input, Snippet, Link } from '@geist-ui/core';

export const WriterContract = ({ wallet, ceramic, writer, handleRerender, handleMessage }) => {
  const [writerContractAddress, setWriterContractAddress] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerDID, setOwnerDID] = useState('');
  const [ownerBasicProfile, setOwnerBasicProfile] = useState('');
  const [userIsOwner, setUserIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState('');
  const [deploymentFee, setDeploymentFee] = useState('');
  const [getterAddress, setGetterAddress] = useState('');
  const [newDeploymentFee, setNewDeploymentFee] = useState('');
  const [deployedContractAddress, setDeployedContractAddress] = useState('');
  const [withdrawBtnLoading, setWithdrawBtnLoading] = useState(false);
  const [getAddressBtnLoading, setGetAddressBtnLoading] = useState(false);
  const [changeDeploymentFeeBtnLoading, setChangeDeploymentFeeBtnLoading] = useState(false);

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

      handleRerender(true);
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

        handleRerender(true);
      }
    } catch (e) {
      console.log(e);

      setChangeDeploymentFeeBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const writerContractAddress = await writer.address;
        setWriterContractAddress(writerContractAddress);
        const ownerAddress = await writer.owner();
        setOwnerAddress(ownerAddress);
        if (ownerAddress === wallet.address) setUserIsOwner(true);
        const contractBalance = await writer.getContractBalance();
        setContractBalance(ethers.utils.formatEther(contractBalance));
        const deploymentFee = await writer.getDeploymentFee();
        setDeploymentFee(ethers.utils.formatEther(deploymentFee));

        const owner = await getUserByAddress(ownerAddress);
        const ownerDID = owner.did;
        setOwnerDID(ownerDID);

        const ownerBasicProfile = await ceramic.store.get('basicProfile', owner.did);
        if (ownerBasicProfile !== undefined && ownerBasicProfile !== null) {
          setOwnerBasicProfile(ownerBasicProfile);
        }
      }
    }
    init();
  }, [writer]);

  return (
    <div className='writer-contract-content'>
      <div className='writer-contract-reads'>
        <Description
          title={wallet.address === ownerAddress ? 'Owner (You)' : 'Owner'}
          content={
            ownerBasicProfile ? (
              <Card shadow marginTop='0.5' width='fit-content'>
                <div className='owner'>
                  <div className='owner-identicon-profile'>
                    <div className='owner-identicon'>
                      <Identicon string={ownerAddress} bg='#eef' size='40' />
                    </div>
                    <div className='owner-basic-profile'>
                      <div className='owner-name'>
                        {ownerBasicProfile.name ? (
                          <Text margin='0' b>
                            {ownerBasicProfile.name}
                          </Text>
                        ) : (
                          <Text margin='0'>--</Text>
                        )}
                      </div>
                      <div className='owner-description'>
                        <Text margin='0'>{ownerBasicProfile.description ? ownerBasicProfile.description : '--'}</Text>
                      </div>
                      <div className='owner-emoji'>
                        <Text margin='0'>{ownerBasicProfile.emoji ? ownerBasicProfile.emoji : '--'}</Text>
                      </div>
                    </div>
                  </div>
                  <div className='owner-address-did'>
                    <div className='owner-did'>
                      <Snippet symbol='DID' text={ownerDID} width='400px' copy='prevent' />
                    </div>
                    <div className='owner-address'>
                      <Snippet type='lite' symbol='Address' text={ownerAddress} width='400px' />
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Spinner />
            )
          }
        />
        <Description
          title='Contract'
          content={
            !writerContractAddress ? (
              <Spinner />
            ) : (
              <Link
                href={`https://mumbai.polygonscan.com/address/${writerContractAddress}`}
                target={'_blank'}
                icon
                style={{ color: '#7B3FE4', fontWeight: 'bold' }}
              >
                Polygonscan
              </Link>
            )
          }
        />
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
        <div className='writer-contract-read'>
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
            <Snippet type='lite' symbol='' text={deployedContractAddress} width='300px' />
          )}
        </div>
      </div>
      <div className='writer-contract-writes'>
        {userIsOwner ? (
          <div className='writer-contract-write'>
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
    </div>
  );
};
