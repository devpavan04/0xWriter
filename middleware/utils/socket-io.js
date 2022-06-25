const Emittery = require('emittery');
const { getThreadID, newThreadDBClient, getAPISignature } = require('../lib/hub-helpers');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New user connected!');

    socket.on('initializeAuthentication', async (message) => {
      const emitter = new Emittery();

      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'token': {
            if (!data.publicKey) {
              throw new Error('User public key is missing!');
            }

            console.log('User public key: ' + data.publicKey);

            const client = await newThreadDBClient();

            const token = await client.getTokenChallenge(data.publicKey, (challenge) => {
              return new Promise((resolve, reject) => {
                //send challenge to client
                io.emit(
                  'initializeAuthenticationResponse',
                  JSON.stringify({
                    type: 'challenge',
                    value: Buffer.from(challenge).toJSON(),
                  })
                );

                //wait for client to solve the challenge
                socket.on('challengeResponse', (userSignature) => {
                  resolve(Buffer.from(userSignature));
                });
              });
            });

            console.log('token:', token);

            // Get API authorization for the user
            const { sig, msg, expiration } = await getAPISignature();

            // Include the token in the auth payload
            const userAuth = {
              sig,
              msg,
              token: token,
              key: process.env.USER_GROUP_KEY,
            };

            // send token to client
            const threadID = await getThreadID();

            io.emit(
              'initializeAuthenticationResponse',
              JSON.stringify({
                type: 'token',
                value: {
                  userAuth,
                  threadID,
                  userAuthExpiration: expiration,
                },
              })
            );

            console.log('Authentication response sent!');

            break;
          }

          case 'challenge': {
            if (!data.userSignature) {
              throw new Error('User signature is missing!');
            }

            await emitter.emit('challengeResponse', data.userSignature);
            break;
          }
        }
      } catch (error) {
        console.error('Error:', error);

        // Notify the client of any errors
        io.emit(
          'initializeAuthenticationResponse',
          JSON.stringify({
            type: 'error',
            value: error.message,
          })
        );
      }
    });
  });

  io.on('disconnect', (socket) => {
    console.log('Socket disconnected!');
  });
};
