import {CLIENT_ID} from './secrets.js';
import {renderBody} from './index.js';

export interface Authorization {
  state(): 'none' | 'valid' | 'expired';
  signIn: () => void;
  refresh: () => void;
  signOut: () => void;
}

export function createAuthorization(
  scope = 'https://www.googleapis.com/auth/drive'
): Authorization {
  let token: {access_token?: string; expiration?: number} = JSON.parse(
    localStorage.getItem('oauthToken') || '{}'
  );
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope,
    callback: (resp) => {
      if (resp.error !== undefined) throw resp;
      token = {
        access_token: resp.access_token,
        expiration: parseFloat(resp.expires_in) - 1 + Date.now() / 1000,
      };
      localStorage.setItem('oauthToken', JSON.stringify(token));
      renderBody();
    },
  });
  gapi.load('client', async () => {
    if (
      token.access_token &&
      token.expiration &&
      Date.now() / 1000 < token.expiration
    ) {
      gapi.client.setToken({access_token: token.access_token});
      renderBody();
    }
  });

  function signIn() {
    tokenClient.requestAccessToken({
      prompt: token.access_token ? '' : 'consent',
    });
  }

  return {
    state: () =>
      token.expiration
        ? token.expiration > Date.now() / 1000
          ? 'valid'
          : 'expired'
        : 'none',
    signIn,
    refresh: signIn,
    signOut() {
      if (token.access_token)
        google.accounts.oauth2.revoke(token.access_token, () => {});
      token = {};
      localStorage.removeItem('oauthToken');
    },
  };
}
