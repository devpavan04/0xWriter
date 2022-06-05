const { io } = require('socket.io-client');

export const solveChallenge = (identity) => {
  return new Promise((resolve, reject) => {
    const socket = io(process.env.REACT_APP_SERVER_URL);

    socket.on('connect', () => {
      const publicKey = identity.public.toString();

      socket.emit(
        'initializeAuthentication',
        JSON.stringify({
          type: 'token',
          publicKey,
        })
      );

      socket.on('initializeAuthenticationResponse', async (responseData) => {
        const data = JSON.parse(responseData);

        switch (data.type) {
          case 'error': {
            reject(data.value);
            break;
          }

          case 'challenge': {
            const challenge = Buffer.from(data.value);
            const signature = await identity.sign(challenge);
            socket.emit('challengeResponse', signature);
            break;
          }

          case 'token': {
            resolve(data.value);
            socket.disconnect();
            break;
          }

          default: {
            reject(data.value);
            break;
          }
        }
      });
    });
  });
};
