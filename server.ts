import express from 'express';
import fetch from 'node-fetch';
import Redis from 'ioredis';

type TokensResponse = {
  access_token: string;
  refresh_token: string;
};

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL;
const redisClient = new Redis(process.env.STORE_URL || '');

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;
const wixInstallerUrl = 'https://www.wix.com/installer';
const wixApisUrl = 'https://www.wixapis.com';

app.get('/', (req, res) => {
  res.send('Hello from server');
});

app.get('/app', (req, res) => {
  const wixToken = req.query.token as string;
  const wixConsentUrl = new URL('/install', wixInstallerUrl);

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

  const wixFinishInstallationUrl = new URL('/close-window', wixInstallerUrl);
  wixFinishInstallationUrl.searchParams.set('access_token', accessToken);

  res.redirect(wixFinishInstallationUrl.href);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});