import {html, render} from 'lit-html';
import {API_KEY} from './secrets.js';
import {createAuthorization, Authorization} from './authorization.js';

let gapiInitialized = false;
let listRequest: gapi.client.Request<gapi.client.drive.FileList> | undefined;
let listResponse: gapi.client.Response<gapi.client.drive.FileList> | undefined;

const auth: Authorization = createAuthorization();

function createNavbar() {
  let menuActive = false;
  return () =>
    html`<nav class="main-nav navbar is-light">
      <div class="container">
        <div class="navbar-brand">
          <a
            class="navbar-burger ${menuActive ? '' : 'is-active'}"
            @click=${(menuActive = !menuActive)}
          >
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        <div class="navbar-end navbar-menu ${menuActive ? 'is-active' : ''}">
          <a
            class="navbar-item button is-text is-size-3-touch"
            @click=${auth.signIn}
          >
            ${auth.state() == 'valid' ? 'Refresh Sign-in' : 'Sign in'}
          </a>
          <a
            class="navbar-item button is-text is-size-3-touch"
            ?disabled=${auth.state() === 'none'}
            @click=${auth.signOut}
          >
            Sign out
          </a>
        </div>
      </div>
    </nav>`;
}
const navbar = createNavbar();

const readyForFirstListing = () =>
  !listRequest && !listResponse && auth.state() == 'valid' && gapiInitialized;

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

// Principal event handler. Incrementally restablishes invarants for business logic and display.
export function renderBody() {
  if (readyForFirstListing()) listFiles();
  render(
    html`
      ${navbar()}
      <div class="columns">
        <div class="column is-2"></div>
        <div class="column">
          <section class="section">
            <h1 class="title is-size-1-touch">Todo</h1>
            <hr />
            <div class="content">
              ${listResponse ? html`<h5>Files:</h5>` : ''}
              ${listResponse ? listingHtml(listResponse.result.files) : ''}
              ${auth.state() === 'valid' ? '' : 'Please sign in to see files.'}
            </div>
          </section>
        </div>
      </div>
    `,
    document.body
  );
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

// This re-renders on every click, so that indivdual click handlers
// (like the navbar-burger) don't need to.
window.onclick = renderBody;
renderBody();
