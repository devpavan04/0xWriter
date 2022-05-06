import { useState } from 'react';
import { Page, Text, Tabs, Spacer, Grid } from '@geist-ui/core';
import { Home } from './components/home';
import { Posts } from './components/posts';

const App = () => {
  const [connection, setConnection] = useState();
  const [connected, setConnected] = useState(false);

  const handleConnection = (connection) => {
    setConnection(connection);
  };

  const handleConnected = (connected) => {
    setConnected(connected);
  };

  return (
    <div style={{ width: '1000px', margin: 'auto' }}>
      <Text h2 mt='2' mb='0' style={{ textAlign: 'center' }}>
        .posts
      </Text>
      <Tabs initialValue='1' mt='1'>
        <Tabs.Item label='Home' value='1'>
          <Home
            connected={connected}
            connection={connection}
            handleConnected={handleConnected}
            handleConnection={handleConnection}
          />
        </Tabs.Item>
        {connected ? (
          <Tabs.Item label='My Posts' value='2'>
            <Posts />
          </Tabs.Item>
        ) : null}
      </Tabs>
    </div>
  );
};

export default App;
