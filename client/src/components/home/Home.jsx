import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './style.css';
import { Button, Text, Card, Note, Tag, Description, Modal, useModal, Input, Snippet } from '@geist-ui/core';

export const Home = ({ wallet, ceramic, handleRerender, handleMessage }) => {
  const { setVisible, bindings } = useModal();
  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [emoji, setEmoji] = useState();
  const [updateProfileBtnLoading, setUpdateProfileBtnLoading] = useState(false);

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

        await ceramic.store.set('basicProfile', {
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

        handleRerender(true);
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

  return (
    <div className='home-content'>
      <Description
        title='User'
        content={
          <Card shadow width='fit-content'>
            <div className='user'>
              <div className='user-identicon-profile'>
                <div className='user-identicon'>
                  <Identicon string={wallet.address} bg='#eef' size='40' />
                </div>
                {ceramic.basicProfile !== undefined ? (
                  <div className='user-basic-profile'>
                    <div className='user-name'>
                      {ceramic.basicProfile !== null && ceramic.basicProfile.name ? (
                        <Text b>{ceramic.basicProfile.name}</Text>
                      ) : (
                        <Text>--</Text>
                      )}
                    </div>
                    <div className='user-description'>
                      <Text>
                        {ceramic.basicProfile !== null && ceramic.basicProfile.description
                          ? ceramic.basicProfile.description
                          : '--'}
                      </Text>
                    </div>
                    <div className='user-emoji'>
                      <Text>
                        {ceramic.basicProfile !== null && ceramic.basicProfile.emoji
                          ? ceramic.basicProfile.emoji
                          : '--'}
                      </Text>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className='user-address-did'>
                <div className='user-did'>
                  <Snippet symbol='DID' text={ceramic.did} width='400px' copy='prevent' />
                </div>
                <div className='user-address'>
                  <Snippet type='lite' symbol='Address' text={wallet.address} width='400px' />
                </div>
              </div>
            </div>
          </Card>
        }
      />
      <Description title='Balance' content={`${wallet.balance} MATIC`} />
      <Description title='Network' content={<Tag type='lite'>Mumbai Testnet</Tag>} />
      {(ceramic.basicProfile !== undefined && ceramic.basicProfile === null) ||
      (ceramic.basicProfile !== undefined &&
        ceramic.basicProfile !== null &&
        (ceramic.basicProfile.name === undefined || ceramic.basicProfile.name === '') &&
        (ceramic.basicProfile.description === undefined || ceramic.basicProfile.description === '') &&
        (ceramic.basicProfile.emoji === undefined || ceramic.basicProfile.emoji === '')) ? (
        <div className='profile-not-found'>
          <Note width='fit-content' marginTop='0' marginBottom='1' label='Note '>
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
