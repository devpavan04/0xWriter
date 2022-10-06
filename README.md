<p align="center">
  <img width="200" src="./client/src/assets/logo/Group 19@3x.png">
</p>

<p align="center">
  <a href="https://0xwriter.xyz" target="_blank">Launch App</a>
  🔏
  <a href="https://youtu.be/ZXcJMdZ59NE" target="_blank">Watch Demo</a>
</p>

<hr />

A decentralized blogging app that facilitates writers to write user centric blog posts and to create token gated access to their content.

This project was submitted at [Encode x Polygon Hackathon 2022](https://www.encode.club/polygon-hackathon)

0xWriter main [contract](https://mumbai.polygonscan.com/address/0xeEDc52b142FED56c675D7157f6C7F4f91aad33b0#code) is deployed and verified on polygon mumbai testnet.

## Features

- Write blog posts that are owned only by you.
- Create, read, update and delete posts.
- Deploy an ERC20 contract to create token gated access to your blog.
- All posts are encrypted.
- Set access control condition - minimum no. of your ERC20 tokens a reader must own to decrypt your content. Setting more conditions will be supported in the future.
- Writer - can mint their ERC20 tokens, transfer them, set new token price and withdraw their contract balance.
- Reader - can mint new writer's tokens and transfer them.
- Set or update your decentralized identity's basic profile - name, description and emoji.

## Demo

[Youtube](https://youtu.be/ZXcJMdZ59NE)

## Installation

Clone this project to test locally

```bash
  git clone https://github.com/devpavan04/0xWriter.git
  cd 0xWriter
  npm install
```

Also install client and middleware dependencies

```bash
  cd middleware
  npm install
  cd ..
  cd client
  npm install
  cd ..
```

## Environment Variables

Add the following in the .env file inside `middleware` folder :

`USER_GROUP_KEY`

`USER_GROUP_SECRET`

You can get the above keys by going through [Textile Docs](https://docs.textile.io/hub/apis/#user-group-key)

Add the following in the .env file inside `client` folder :

`REACT_APP_INFURA_API_KEY`

`REACT_APP_SERVER_URL` - http://localhost:3001

`REACT_APP_CERAMIC_URL` - http://localhost:7007

## Run Locally

Start ceramic daemon

```bash
  npm install -g @ceramicnetwork/cli
  ceramic daemon
```

Run middleware

```bash
  cd middleware
  npm start
```

Start client

```bash
  cd client
  npm start
```

Go to http://localhost:3000 on your browser to interact with the dapp.

## Technologies used

- [Ceramic DID DataStore](https://developers.ceramic.network/tools/glaze/did-datastore/)

- [Textile ThreadDB](https://docs.textile.io/threads/)

- [Lit Protocol](https://litprotocol.com/)

Read more on how the above technologies are used in the app [here](https://glory-barber-0dd.notion.site/0xWriter-Tech-Stack-e2e79965a4524147ac6dc079b82e3ac8)

## Built With

- [Create React App](https://create-react-app.dev/)

- [Express JS](https://expressjs.com/)

- [Geist UI](https://geist-ui.dev/en-us)

- [Remix Icons](https://remixicon.com/)

## Author

[@pavansoratur](https://github.com/devpavan04)
