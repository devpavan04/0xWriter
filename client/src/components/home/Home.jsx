import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import { Card, Button, Spacer, Divider, Text, Note, Tag, Description, Modal, useModal, Input } from '@geist-ui/core';

export const Home = ({ wallet, ceramic, handleMessage }) => {
  const { address, balance, chainId } = wallet;
  const { idx, basicProfile } = ceramic;

  const { setVisible, bindings } = useModal();

  const [name, setName] = useState(basicProfile.name);
  const [description, setDescription] = useState(basicProfile.description);
  const [emoji, setEmoji] = useState(basicProfile.emoji);

  const updateBasicProfile = async () => {
    if (name === '') {
      handleMessage('warning', 'Please enter name.');
    } else if (description === '') {
      handleMessage('warning', 'Please enter description.');
    } else if (emoji === '') {
      handleMessage('warning', 'Please enter emoji.');
    } else {
      try {
        await idx.set('basicProfile', {
          name,
          description,
          emoji,
        });

        handleMessage('success', 'Basic Profile successfully updated.');
      } catch (e) {
        handleMessage('error', e.message);
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
        <div className='modal-content'>
          <Input clearable label='Name' value={name} onChange={(e) => setName(e.target.value)} width='100%' />
          <Input
            clearable
            label='Description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            width='100%'
          />
          <Input clearable label='Emoji' value={emoji} onChange={(e) => setEmoji(e.target.value)} width='100%' />
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
        {/* <Identicon string={address} size='30' />
        <Spacer /> */}
        <Description title='Address' content={address.substr(0, 10) + '....' + address.slice(address.length - 12)} />
      </div>
      <Description title='Balance' content={`${balance} ETH`} />
      <Description
        title='Network'
        content={
          <Tag type='lite'>
            {chainId === 1
              ? 'Mainnet'
              : chainId === 3
              ? 'Ropsten'
              : chainId === 4
              ? 'Rinkeby'
              : chainId === 42
              ? 'Kovan'
              : ''}
          </Tag>
        }
      />
      {basicProfile !== undefined && basicProfile === null ? (
        <div className='profile-not-found'>
          <Text>Basic Profile not found, update now.</Text>
          <Button type='secondary' ghost auto onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </div>
      ) : (
        <>
          <Description title='Name' content={basicProfile.name ? basicProfile.name : '--'} />
          <Description title='Description' content={basicProfile.description ? basicProfile.description : '--'} />
          <Description title='Emoji' content={basicProfile.emoji ? basicProfile.emoji : '--'} />
          <Button type='secondary' ghost className='update-profile-btn' onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </>
      )}
    </div>
  );
};
