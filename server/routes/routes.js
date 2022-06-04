const fs = require('fs');
const { initializeNewThreadDb, getThreadID, getAPISignature } = require('../lib/hub-helpers');

module.exports = (app) => {
  app.get('/initializeNewThreadDB', async (req, res) => {
    const thread = await initializeNewThreadDb();
    const threadID = Array.from(thread);
    fs.writeFileSync(
      'threadID.json',
      JSON.stringify({
        threadID,
      }),
      (e) => {
        if (e) {
          console.log(e);
        }
        console.log('ThreadID stored in the file!');
      }
    );
    console.log('New threadDB created!');

    res.send({ message: 'New threadDB created!' });
  });

  app.get('/getThreadID', async (req, res) => {
    const threadID = await getThreadID();

    res.send({ threadID });
  });
};
