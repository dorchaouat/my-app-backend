import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import Redis from 'ioredis';

type TokensResponse = {
  access_token: string;
  refresh_token: string;
};

type Subscription = {
  id: string;
  email: string;
  subscriptionStatus: string;
  deliverabilityStatus: string;
  createdDate: string;
  updatedDate: string;
};

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL;
const redisClient = new Redis(process.env.STORE_URL || '');

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;
const wixInstallerUrl = 'https://www.wix.com/installer';
const wixApisUrl = 'https://www.wixapis.com';

app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/', (req, res) => {
  res.send('Hello from server');
});

app.get('/app', (req, res) => {
  const wixToken = req.query.token as string;
  const wixConsentUrl = new URL(`${wixInstallerUrl}/install`);

  wixConsentUrl.searchParams.set('token', wixToken);
  wixConsentUrl.searchParams.set('appId', appId);
  wixConsentUrl.searchParams.set('redirectUrl', `${baseUrl}/redirect`);

  res.redirect(wixConsentUrl.href);
});

app.get('/redirect', async (req, res) => {
  const wixCode = req.query.code;

  const tokensResponse: TokensResponse = await fetch(`${wixApisUrl}/oauth/access`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "grant_type": "authorization_code",
      "client_id": appId,
      "client_secret": appSecret,
      "code": wixCode,
    }),
  }).then(res => res.json());

  const refreshToken = tokensResponse.refresh_token;
  const accessToken = tokensResponse.access_token;

  await redisClient.set(req.query.instanceId as string, refreshToken);

  const wixFinishInstallationUrl = new URL(`${wixInstallerUrl}/close-window`);
  wixFinishInstallationUrl.searchParams.set('access_token', accessToken);

  res.redirect(wixFinishInstallationUrl.href);
});

app.post('/subscribe', async (req, res) => {
  console.log("REQUEST", req.body);
  const refreshToken = await redisClient.get(req.body.instanceId as string);
  const email = req.body.email;

  console.log("REFRESH TOKEN", refreshToken)

  const tokensResponse: TokensResponse = await fetch(`${wixApisUrl}/oauth/access`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "grant_type": "refresh_token",
      "client_id": appId,
      "client_secret": appSecret,
      "refresh_token": refreshToken,
    }),
  }).then(res => res.json());

  const accessToken = tokensResponse.access_token;
  console.log("ACCESS TOKEN", accessToken);

  const subscriptionRequest = {
    subscription: {
      email,
      subscriptionStatus: "SUBSCRIBED",
      deliverabilityStatus: "VALID",
    },
  };

  const subscriptionsResponse = await fetch(`${wixApisUrl}/email-marketing/v1/email-subscriptions`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify(subscriptionRequest),
  }).then(res => res.json());

  res.json(subscriptionsResponse);
});

app.get('/subscriptions', async (req, res) => {
  console.log("INSTANCE ID", req.query.instanceId);
  const refreshToken = await redisClient.get(req.query.instanceId as string);

  console.log("REFRESH TOKEN", refreshToken)

  const tokensResponse: TokensResponse = await fetch(`${wixApisUrl}/oauth/access`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "grant_type": "refresh_token",
      "client_id": appId,
      "client_secret": appSecret,
      "refresh_token": refreshToken,
    }),
  }).then(res => res.json());

  const accessToken = tokensResponse.access_token;
  console.log("ACCESS TOKEN", accessToken);

  const subscriptionsResponse = await fetch(`${wixApisUrl}/email-marketing/v1/email-subscriptions/query`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify({
      filters: {},
    }),
  }).then(res => res.json());

  res.json(subscriptionsResponse);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});