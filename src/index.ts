import {html, render} from 'lit-html';
import {CLIENT_ID, API_KEY} from './secrets.js';

var gapiInitialized = false;
var haveAuthorization = false;
var listRequest: gapi.client.Request<gapi.client.drive.FileList> | undefined;
var listResponse: gapi.client.Response<gapi.client.drive.FileList> | undefined;

const listingHtml = (files: gapi.client.drive.File[] | undefined) =>
  files
    ? html`
        <table>
          <tr>
            <th>Name</th>
            <th>ID</th>
          </tr>
          ${files.map(
            (file) =>
              html`<tr>
                <td>${file.name}</td>
                <td>${file.id}</td>
              </tr>`
          )}
        </table>
      `
    : '';

function renderBody() {
  if (!listRequest && !listResponse && haveAuthorization && gapiInitialized) {
    listFiles();
  }
  render(
    html`
      <button
        @click=${authenticate}
        style="visibility:${gapiInitialized ? 'visible' : 'hidden'}"
      >
        ${haveAuthorization ? 'Refresh' : 'Authorize'}
      </button>
      <button
        id="signout_button"
        @click=${signOut}
        style="visibility:${haveAuthorization ? 'visible' : 'hidden'}"
      >
        Sign Out
      </button>
      <div id="content">${listResponse ? 'Files:\n' : ''}</div>
      ${listResponse ? listingHtml(listResponse.result.files) : ''}
      ${haveAuthorization ? '' : 'Please authorize to see files.'}
    `,
    document.body
  );
}

const tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
  callback: (resp) => {
    if (resp.error !== undefined) throw resp;
    haveAuthorization = true;
    renderBody();
  },
});

/**
 * Sign in the user upon button click.
 */
function authenticate() {
  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
}

/**
 *  Sign out the user upon button click.
 */
export function signOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      haveAuthorization = false;
      renderBody();
    });
    gapi.client.setToken(null);
  }
}

/**
 * Print metadata for first 10 files.
 */
async function listFiles() {
  listRequest = gapi.client.drive.files.list({
    pageSize: 10,
    fields: 'files(id, name)',
  });
  listResponse = await listRequest;
  listRequest = undefined;
  renderBody();
}

/**
 * Load and then initialize the gapi.client object.
 */
gapi.load('client', async () => {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    ],
  });
  gapiInitialized = true;
  renderBody();
});

window.onmousedown = window.onmouseup = renderBody;
renderBody();
