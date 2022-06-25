const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/routes');
const socket = require('./utils/socket-io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const http = require('http').createServer(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});

routes(app);
socket(io);

const PORT = process.env.PORT || 3001;

http.listen(PORT, () => {
  console.log('Server running on port:', PORT);
});
