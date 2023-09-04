import {html, render} from 'lit-html';
import {API_KEY, TODO_FILE_ID} from './secrets.js';
import {createAuthorization, Authorization} from './authorization.js';

let gapiInitialized = false;
let getRequest: gapi.client.Request<gapi.client.drive.File> | undefined;
let getResponse: gapi.client.Response<gapi.client.drive.File> | undefined;

interface NavButton {
  text: string;
  disabled?: boolean;
  onClick: () => void;
}

const navButtonHtml = ({text, disabled, onClick}: NavButton) =>
  html` <a
    class="navbar-item button is-text is-size-3-touch"
    ?disabled=${disabled || false}
    @click=${onClick}
  >
    ${text}
  </a>`;

interface Page {
  signIn: NavButton;
  signOut: NavButton;
  todoEntry: {text: string; onChange: () => void};
  filter: Array<string>;
  todoList: Array<string>;
}

const createNavbarRenderer = () => {
  let menuActive = false;
  return ({signIn, signOut}: Page) =>
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
          ${navButtonHtml(signIn)} ${navButtonHtml(signOut)}
        </div>
      </div>
    </nav>`;
};

const createPageRenderer = () => {
  const navbar = createNavbarRenderer();
  const onChange = (e: Event) => {
    page.todoEntry.text = (e.target as HTMLInputElement).value;
    page.todoEntry.onChange();
    renderBody();
  };
  return (page: Page) => html`
    ${navbar(page)}
    <div class="columns">
      <div class="column is-2"></div>
      <div class="column">
        <div style="width:80%">
        <input class="input" type='text' placeholder='take the path less traveled' @change=${onChange}>${
          page.todoEntry.text
        }</input></div>
        <table>
    ${page.todoList.map(
      (todo) =>
        html`<tr>
          <td>${todo}</td>
        </tr>`
    )}
    </table>
    </div>
    </div>
  `;
};
const auth: Authorization = createAuthorization();

const readyForFirstListing = () =>
  !getRequest && !getResponse && auth.state() == 'valid' && gapiInitialized;

const pageRenderer = createPageRenderer();
const page: Page = {
  signIn: {text: 'Sign In', onClick: auth.signIn},
  signOut: {text: 'Sign Out', disabled: true, onClick: auth.signOut},
  todoEntry: {text: '', onChange: () => {}},
  filter: [],
  todoList: [],
};

// Principal event handler. Incrementally restablishes invarants for business logic and display.
export function renderBody() {
  if (readyForFirstListing()) fetchTodos();
  render(pageRenderer(page), document.body);
}

/**
 * Print metadata for first 10 files.
 */
async function fetchTodos() {
  getRequest = gapi.client.drive.files.get({
    fileId:TODO_FILE_ID,
    alt: 'media'
  });
  getResponse = await getRequest;
  getRequest = undefined;
  page.todoList = (getResponse.body || '').split('\n');
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
