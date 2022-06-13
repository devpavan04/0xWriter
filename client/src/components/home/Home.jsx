import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import { Button, Text, Card, Note, Tag, Description, Modal, useModal, Input, Snippet } from '@geist-ui/core';

export const Home = ({ wallet, ceramic, handleMessage }) => {
  const { setVisible, bindings } = useModal();

  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [emoji, setEmoji] = useState();
  const [updateProfileBtnLoading, setUpdateProfileBtnLoading] = useState(false);

  useEffect(() => {
    function init() {
      if (ceramic.basicProfile !== undefined && ceramic.basicProfile !== null) {
        setName(ceramic.basicProfile.name);
        setDescription(ceramic.basicProfile.description);
        setEmoji(ceramic.basicProfile.emoji);
      }
    }
    init();
  }, []);

  const updateBasicProfile = async () => {
    try {
      if (!name) {
        handleMessage('warning', 'Please enter name.');
      } else if (!description) {
        handleMessage('warning', 'Please enter description.');
      } else if (!emoji) {
        handleMessage('warning', 'Please enter emoji.');
      } else {
        setUpdateProfileBtnLoading(true);

        await ceramic.store.set('BasicProfileDefinition', {
          name,
          description,
          emoji,
        });

        setUpdateProfileBtnLoading(false);
        handleMessage('success', 'Basic Profile successfully updated.');

        setName('');
        setDescription('');
        setEmoji('');

        setVisible(false);

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setUpdateProfileBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const renderUpdateBasicProfileModal = () => {
    return (
      <Modal {...bindings} width='360px'>
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
          {updateProfileBtnLoading ? (
            <Button type='secondary' shadow loading scale={0.8} width='100%'>
              Update Profile
            </Button>
          ) : (
            <Button type='secondary' shadow scale={0.8} width='100%' onClick={updateBasicProfile}>
              Update Profile
            </Button>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div className='home-content'>
      <Description
        title='User'
        content={
          <Card shadow width='100%'>
            <div className='user'>
              <div className='user-identicon-profile'>
                <div className='user-identicon'>
                  <Identicon string={wallet.address} bg='#eef' size='40' />
                </div>
                {ceramic.basicProfile !== undefined && ceramic.basicProfile !== null ? (
                  <div className='user-basic-profile'>
                    <div className='user-name'>
                      {ceramic.basicProfile.name ? <Text b>{ceramic.basicProfile.name}</Text> : <Text>--</Text>}
                    </div>
                    <div className='user-description'>
                      <Text>{ceramic.basicProfile.description ? ceramic.basicProfile.description : '--'}</Text>
                    </div>
                    <div className='user-emoji'>
                      <Text>{ceramic.basicProfile.emoji ? ceramic.basicProfile.emoji : '--'}</Text>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className='user-address-did'>
                <div className='user-did'>
                  <Snippet type='lite' symbol='DID' text={ceramic.did} width='fit-content' />
                </div>
                <div className='user-address'>
                  <Snippet type='lite' symbol='Address' text={wallet.address} width='fit-content' />
                </div>
              </div>
            </div>
          </Card>
        }
      />
      <Description title='Balance' content={`${wallet.balance} MATIC`} />
      <Description title='Network' content={<Tag type='lite'>Mumbai Testnet</Tag>} />
      {ceramic.basicProfile !== undefined && ceramic.basicProfile === null ? (
        <div className='profile-not-found'>
          <Note width='fit-content' marginTop='0' marginBottom='1' type='secondary' label={false}>
            Basic Profile not found, update now.
          </Note>
          <Button type='secondary' shadow scale={0.8} auto onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </div>
      ) : (
        <>
          <Button type='secondary' shadow scale={0.8} className='update-profile-btn' onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </>
      )}
    </div>
  );
};
