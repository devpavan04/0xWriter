import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import {
  Card,
  Button,
  Spacer,
  Divider,
  Text,
  useToasts,
  Spinner,
  Tag,
  Description,
  Modal,
  useModal,
  Input,
} from '@geist-ui/core';

export const Home = ({ wallet, ceramic, handleMessage }) => {
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
    <div className='homeContent'>
      <div className='wallet'>
        <Card>
          <Card.Content>
            <Text b>Wallet</Text>
          </Card.Content>
          <Divider />
          <Card.Content>
            <div className='walletContent'>
              <div className='address'>
                <Identicon string={wallet.address} size='30' />
                <Spacer />
                <Description
                  title='Address'
                  content={wallet.address.substr(0, 5) + '...' + wallet.address.slice(wallet.address.length - 5)}
                />
              </div>
              <Spacer w={8} />
              <Description title='Balance' content={`${wallet.balance} ETH`} />
              <Spacer w={8} />
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
            </div>
          </Card.Content>
        </Card>
      </div>
      <Spacer h={2} />
      <div className='basicProfile'>
        <Card>
          <Card.Content>
            <Text b>Basic Profile</Text>
          </Card.Content>
          <Divider />
          <Card.Content>
            {ceramic.basicProfile === undefined ? (
              <div className='loader'>
                <p>Fetching Basic Profile</p>
                <Spacer />
                <Spinner />
              </div>
            ) : ceramic.basicProfile === null ? (
              <div className='basicProfileNotFound'>
                <p>Basic Profile not found, update now!?</p>
                <Spacer w={4} />
                <Button type='secondary' ghost auto onClick={() => setVisible(true)}>
                  Update Profile
                </Button>
                {renderUpdateBasicProfileModal()}
              </div>
            ) : (
              <div className='basicProfileContent'>
                <Description title='Name' content={ceramic.basicProfile.name ? ceramic.basicProfile.name : '--'} />
                <Spacer w={8} />
                <Description
                  title='Description'
                  content={ceramic.basicProfile.description ? ceramic.basicProfile.description : '--'}
                />
                <Spacer w={8} />
                <Description title='Emoji' content={ceramic.basicProfile.emoji ? ceramic.basicProfile.emoji : '--'} />
                <Spacer w={8} />
                <Button className='updateProfileBtn' type='secondary' ghost auto onClick={() => setVisible(true)}>
                  Update Profile
                </Button>
                {renderUpdateBasicProfileModal()}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};
