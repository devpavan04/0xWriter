import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../../contracts/abi.json';
import './style.css';
import { Button, Spinner, Note, Tag, Description, Input } from '@geist-ui/core';

export const AccessControl = ({ wallet, ceramic, writer, handleMessage }) => {
  const [userHasDeployed, setUserHasDeployed] = useState(false);
  const [userDeployedContractAddress, setUserDeployedContractAddress] = useState('');
  const [userTokenName, setUserTokenName] = useState('');
  const [userTokenSymbol, setUserTokenSymbol] = useState('');
  const [minTokenCount, setMinTokenCount] = useState('');
  const [newMinTokenCount, setNewMinTokenCount] = useState('');
  const [minTokenCountBtnLoading, setMinTokenCountBtnLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const userHasDeployed = await writer.getHasWriterDeployed(wallet.address);
        if (userHasDeployed) {
          setUserHasDeployed(true);

          const deployedContractAddress = await writer.getWriterDeployedContractAddress(wallet.address);
          setUserDeployedContractAddress(deployedContractAddress);

          const writerERC20 = new ethers.Contract(deployedContractAddress, contractABI.writerERC20, wallet.signer);

          const userTokenName = await writerERC20.name();
          setUserTokenName(userTokenName);

          const userTokenSymbol = await writerERC20.symbol();
          setUserTokenSymbol(userTokenSymbol);

          const writerData = await ceramic.store.get('writerData', ceramic.did);
          
          if (writerData !== undefined && writerData !== null) {
            const accessControlConditions = writerData.accessControlConditions[0];
            const minTokenCount = accessControlConditions[0].returnValueTest.value;
            setMinTokenCount(minTokenCount);
          } else {
            setMinTokenCount('not set');
          }
        }
      }
    }
    init();
  }, [writer]);

  const setMinNoOfTokensCount = async () => {
    try {
      if (!newMinTokenCount) {
        handleMessage('warning', 'Please enter min no. of tokens.');
      } else if (Number(newMinTokenCount) === 0) {
        handleMessage('warning', 'Min no. of tokens required to access content should be atleast 1.');
      } else {
        setMinTokenCountBtnLoading(true);

        const accessControlConditions = [
          {
            contractAddress: userDeployedContractAddress,
            standardContractType: 'ERC20',
            chain: 'mumbai',
            method: 'balanceOf',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '>=',
              value: newMinTokenCount,
            },
          },
        ];

        await ceramic.store.merge('writerData', { accessControlConditions: [accessControlConditions] });

        setMinTokenCountBtnLoading(false);
        handleMessage('success', 'New min no. of tokens required successfully updated.');

        setNewMinTokenCount('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setMinTokenCountBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  return (
    <div className='access-control-content'>
      {userHasDeployed ? (
        <>
          <Note width='fit-content' label='Info '>
            Here you can set the minimum no. of your tokens a reader must own in order to read your blog.
          </Note>
          <div className='user-access-control-content'>
            <div className='access-control-reads'>
              <Description title='Token Name' content={!userTokenName ? <Spinner /> : userTokenName} />
              <Description title='Token Symbol' content={!userTokenSymbol ? <Spinner /> : userTokenSymbol} />
              <Description
                title='Current Min no. Of tokens required'
                content={!minTokenCount ? <Spinner /> : minTokenCount === 'not set' ? '--' : minTokenCount}
              />
            </div>
            <div className='access-contrl-writes'>
              <div className='access-contrl-write'>
                <Input
                  clearable
                  type='secondary'
                  placeholder='No. of tokens: 5'
                  onChange={(e) => setNewMinTokenCount(e.target.value)}
                  width='80%'
                >
                  Set New Min No. of Tokens Required
                </Input>
                {minTokenCountBtnLoading ? (
                  <Button type='secondary' shadow loading className='btn' scale={0.8}>
                    Set New Min No. of Tokens
                  </Button>
                ) : (
                  <Button type='secondary' shadow className='btn' auto scale={0.8} onClick={setMinNoOfTokensCount}>
                    Set New Min No. of Tokens
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Note width='fit-content' label='Note '>
            In order to set access control condition to your blog, you must first deploy an ERC20 contract
            (WriterERC20). To do that, head over to <b>My Contract</b> section.
          </Note>
        </>
      )}
    </div>
  );
};
