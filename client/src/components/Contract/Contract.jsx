import { useState, useEffect } from 'react';
import './contract.css';
import { Card, Button, Spacer, Divider, Text, Note, Tag, Description, Modal, useModal, Input } from '@geist-ui/core';

export const Contract = ({ user, handleMessage }) => {
  const [tokenName, setTokenName] = useState();
  const [tokenSymbol, setTokenSymbol] = useState();
  const [tokenPrice, setTokenPrice] = useState();
  const [initialMint, setInitialMinit] = useState();

  useEffect(() => {
    function init() {
      if (user && user !== null) {
        console.log(user);
      }
    }
    init();
  }, []);

  const deployWriterERC20Contract = () => {
    if (tokenName === '') {
      handleMessage('warning', 'Please enter token name.');
    } else if (tokenSymbol === '') {
      handleMessage('warning', 'Please enter token symbol.');
    } else if (tokenPrice === '') {
      handleMessage('warning', 'Please enter token price.');
    } else if (initialMint === '') {
      handleMessage('warning', 'Please enter initial mint.');
    } else {
      handleMessage('secondary', 'Deploying...');

      // try {
      //   await store.set('BasicProfileDefinition', {
      //     name,
      //     description,
      //     emoji,
      //   });

      //   handleMessage('success', 'Basic Profile successfully updated.');
      // } catch (e) {
      //   handleMessage('error', e.message);
      // }

      setTokenName('');
      setTokenSymbol('');
      setTokenPrice('');
      setInitialMinit('');

      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    }
  };

  return (
    <div className='contract-content'>
      {user && user !== null && user.deployedContractAddress === '' ? (
        <>
          <Note width='fit-content' margin='auto' type='default' label={false}>
            Deploy ERC20 contract to create token gated access to your blog.
          </Note>
          <Spacer h={2} />
          <div className='contract-form'>
            <Input value='ERC20' readOnly type='secondary' width='50%'>
              Contract Type
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='Token'
              onChange={(e) => setTokenName(e.target.value)}
              width='50%'
            >
              Token Name
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='TKN'
              onChange={(e) => setTokenSymbol(e.target.value)}
              width='50%'
            >
              Token Symbol
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='0.02'
              onChange={(e) => setTokenPrice(e.target.value)}
              width='50%'
            >
              Token Price (MATIC)
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='1000'
              onChange={(e) => setInitialMinit(e.target.value)}
              width='50%'
            >
              Initial Mint
            </Input>
            <Button type='secondary' className='update-profile-btn' onClick={deployWriterERC20Contract}>
              Deploy Contract
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
