const TwitchOAuth = require('./src/twitch-oauth');

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const qs = require('querystring');
const https = require('https');

const app = express();

const sslServer = https.createServer({
	key: '',
	cert: ''
},
app);

app.use(cors({origin: true, credentials: true}));

const buffer = crypto.randomBytes(16);
const state = buffer.toString('hex');

const twitchOAuth = new TwitchOAuth({
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	redirect_uri: process.env.REDIRECT_URI,
	scopes: [
		'user:edit:broadcast',
		'viewing_activity_read',
		'user:edit:follows'
	]
}, state);

app.get('/', (req, res) => {
	res.status(200).send(`<a href="/authorize">Authorize</a>`);
});

app.get('/home', (req, res) => {
	res.status(200).send(`<a href="/test">Test</a>`);
});

app.get('/test', async (req, res) => {
	const url = `https://api.twitch.tv/helix/users/extensions?user_id=${101223367}`;

	try {
		const json = await twitchOAuth.getEndpoint(url);
		res.status(200).json({ json });
	} catch (err) {
		console.error(err);
		res.redirect('/failed');
	}
});

app.get('/id', async (req, res) => {
	console.log("ID");
	const url = `https://api.twitch.tv/helix/users`;

	try {
		const json = await twitchOAuth.getEndpoint(url);
		console.log(json);
		res.status(200).json({ json });
	} catch (err) {
		console.error(err);
		res.redirect('/failed');
	}
});

app.post('/follow', async (req, res) => {
	const url = `https://api.twitch.tv/helix/users/follows?to_id=${116892981}&from_id=${696802096}`;
	// const url = `https://api.twitch.tv/kraken/users/${101223367}/follows/channels/<channel ID>`;

	try {
		const json = await twitchOAuth.getEndpoint(url);
		console.log(json);
		res.status(200).json({ json });
	} catch (err) {
		console.error(err);
	}
});

app.get('/authorize', (req, res) => {
	console.log("Entrou");
	res.json(twitchOAuth.authorizeUrl);
});

app.get('/auth-callback', async (req, res) => {
	console.log("CONF");
	const req_data = qs.parse(req.url.split('?')[1]);
	const code = req_data['code'];
	const state = req_data['state'];

	try {
		twitchOAuth.confirmState(state);
		await twitchOAuth.fetchToken(code);
		console.log('authenticated');
		res.redirect('/home');
	} catch (err) {
		console.error(err);
		res.redirect('/failed');
	}

});



const server = app.listen(3333, () => {
	const port = server.address().port;
	console.log(`Server listening on port ${port}`);

	// const url = twitchOAuth.authorizeUrl;
	// const open = require('open');
	// open(url);
});

module.exports = TwitchOAuth;
