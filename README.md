# Todo

A web app study for lit-html without app framework.

### Managing API key and Client ID

File `src/secrets.js` is in `.gitignore` and looks like this:
```ts
export const API_KEY='AIz...';
export const CLIENT_ID='9113...googleusercontent.com';
```
It is imported into `src/index.ts`.

After cloning the git repo, you must find or create an API key and web
app credential with Client ID. Use the
[console](https://console.cloud.google.com/apis/credentials) for this.
