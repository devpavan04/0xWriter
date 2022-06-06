import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import { Card, Button, Spacer, Divider, Text, Note, Tag, Description, Modal, useModal, Input } from '@geist-ui/core';

export const Home = ({ wallet, ceramic, user, users, handleMessage }) => {
  const { setVisible, bindings } = useModal();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');

  const updateBasicProfile = async () => {
    if (name === '') {
      handleMessage('warning', 'Please enter name.');
    } else if (description === '') {
      handleMessage('warning', 'Please enter description.');
    } else if (emoji === '') {
      handleMessage('warning', 'Please enter emoji.');
    } else {
      handleMessage('secondary', 'Updating Basic Profile...');
      try {
        await ceramic.idx.set('basicProfile', {
          name,
          description,
          emoji,
        });
        handleMessage('success', 'Basic Profile successfully updated.');
        handleMessage('secondary', 'Loading...');
      } catch (e) {
        handleMessage('error', 'Updating Basic Profile failed.');
      }
      setName('');
      setDescription('');
      setEmoji('');
      setVisible(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const renderUpdateBasicProfileModal = () => {
    return (
      <Modal {...bindings}>
        <div className='modalContent'>
          <Input clearable label='Name' onChange={(e) => setName(e.target.value)} width='100%' />
          <Spacer />
          <Input clearable label='Description' onChange={(e) => setDescription(e.target.value)} width='100%' />
          <Spacer />
          <Input clearable label='Emoji' onChange={(e) => setEmoji(e.target.value)} width='100%' />
          <Spacer />
          <Button type='secondary' ghost auto onClick={updateBasicProfile}>
            Update Profile
          </Button>
        </div>
      </Modal>
    );
  };

  return (
    <div className='home-content'>
      <div className='address-identicon'>
        <Identicon string={wallet.address} size='30' />
        <Spacer />
        <Description
          title='Address'
          content={wallet.address.substr(0, 5) + '...' + wallet.address.slice(wallet.address.length - 5)}
        />
      </div>
      <Description title='Balance' content={`${wallet.balance} ETH`} />
      <Description
        title='Network'
        content={
          <Tag type='lite'>
            {wallet.chainId === 1
              ? 'Mainnet'
              : wallet.chainId === 3
              ? 'Ropsten'
              : wallet.chainId === 4
              ? 'Rinkeby'
              : wallet.chainId === 42
              ? 'Kovan'
              : ''}
          </Tag>
        }
      />
      {ceramic.basicProfile !== undefined && ceramic.basicProfile === null ? (
        <div className='profile-not-found'>
          <Text>Basic Profile not found, update now!?</Text>
          <Button type='secondary' ghost auto onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </div>
      ) : (
        <>
          <Description title='Name' content={ceramic.basicProfile.name ? ceramic.basicProfile.name : '--'} />
          <Description
            title='Description'
            content={ceramic.basicProfile.description ? ceramic.basicProfile.description : '--'}
          />
          <Description title='Emoji' content={ceramic.basicProfile.emoji ? ceramic.basicProfile.emoji : '--'} />
          <Button type='secondary' ghost className='update-profile-btn' onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </>
      )}
    </div>
  );
};
