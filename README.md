# Social Sanitation Admin

The admin panel for Social Sanitation. It covers clients, bookings, employees, scheduling, estimates, quotes, invoices, contracts, inspections, supplies and team chat. It is a single-page React app built with Vite.

## Requirements

- Node.js 22.22 or newer (react-router 8 requires it)
- npm

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

The dev server prints its local URL (http://localhost:5173 by default). If a required environment variable is missing, `npm run dev` and `npm run build` stop with an error that names it.

## Scripts

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Starts the dev server with hot reload  |
| `npm run build`   | Builds for production into `dist/`     |
| `npm run preview` | Serves the `dist/` build locally       |
| `npm run lint`    | Runs ESLint                            |

## Environment variables

Configuration lives in `.env`, which is gitignored. `.env.example` lists every variable with placeholder values.

| Variable                            | Required | Used for                                                                                       |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`                 | Yes      | The backend REST API, with a trailing slash. Images are served from `<this URL>images/`.         |
| `VITE_UPLOADS_BASE_URL`             | Yes      | The server that hosts restock-request photos, with no trailing slash.                          |
| `VITE_GOOGLE_MAPS_API_KEY`          | Yes      | Google Maps: client and employee maps, guest booking address lookup, geocoding.                |
| `VITE_FIREBASE_API_KEY`             | Yes      | The Firebase web app. Realtime Database powers chat; Storage holds chat attachments.            |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_DATABASE_URL`        | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_PROJECT_ID`          | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_APP_ID`              | Yes      | Firebase                                                                                       |
| `VITE_FIREBASE_MEASUREMENT_ID`      | No       | Google Analytics for Firebase                                                                  |

Vite copies these values into the JavaScript bundle at build time, so anyone who opens the site can read them. That makes them public configuration, not secrets, so never put a server secret in a `VITE_` variable. Protect the services themselves instead:

- In Google Cloud Console, restrict the Maps key to your domains with an HTTP referrer restriction.
- Lock down the Firebase database and storage with security rules.

Code reads these values only through `src/config/env.js`. Don't use `import.meta.env` anywhere else. Public constants that are the same in every environment, such as the logo URL, live in `src/config/brand.js`.

## Deploying

1. Set the variables above in your hosting or CI settings. The build fails if a required one is missing.
2. Run `npm run build` and serve the `dist/` folder.
3. The app uses browser routing, so configure the host to serve `index.html` for any path that isn't a file.

## Tech stack

| Concern           | Package                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| UI components     | [antd](https://ant.design) 6, themed from the design tokens in `src/index.css`       |
| Icons             | [lucide-react](https://lucide.dev)                                                   |
| Routing           | [react-router](https://reactrouter.com) 8. Import from `react-router`; `react-router-dom` no longer exists. |
| Rich text         | [Tiptap](https://tiptap.dev), wrapped in `src/components/RichTextEditor.jsx`         |
| HTTP              | axios, through the shared client in `src/services/httpClient.js`                     |
| Chat              | Firebase Realtime Database and Storage                                               |
| Maps              | `@react-google-maps/api`                                                             |
| Dates             | dayjs, with its plugins registered in `src/lib/dayjs.js`                             |

Each concern uses exactly one package. Don't add a second UI kit, icon set, router or editor next to these.

## Project structure

```
src/
├── main.jsx              App entry: fonts, global styles and the antd theme provider
├── App.jsx               Router setup
├── index.css             Design tokens (colors, spacing, radii, shadows, fonts) and global styles
├── routes/AppRoutes.jsx  Every route; pages are lazy-loaded
├── layouts/              MainLayout: sidebar, header and the signed-in shell
├── pages/<feature>/      One folder per feature: clients/, bookings/, invoices/ ...
│   ├── XxxPage.jsx       Route components
│   ├── XxxPage.scss      Styles for that page
│   ├── <feature>.scss    Styles shared by the feature's pages
│   └── components/       Components used only by this feature
├── components/           Shared components (PageHeader, PageLoader, RichTextEditor, SignatureField ...)
├── services/
│   ├── httpClient.js     Shared axios instance: API base URL, sends 401s back to the login page
│   └── api/              One module per backend resource (bookingApi.js, invoiceApi.js ...)
├── config/
│   ├── env.js            Reads and validates the VITE_ variables
│   └── brand.js          Public brand constants
├── lib/                  Third-party setup (Firebase, dayjs)
├── theme/antdTheme.js    antd theme built from the tokens in index.css
├── styles/               Stylesheets shared across features
├── utils/                Small helpers (downloads, debounce, Excel export, image compression, geocoding)
└── assets/images/        Images bundled with the app

public/
├── favicon.ico, favicon.png, apple-touch-icon.png
└── forms/                Standalone HTML forms, served as-is outside the React app
```

## Conventions

### Naming

| What                                   | Convention                                                                                              | Example                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Feature folders                        | kebab-case                                                                                              | `pages/service-requests/`                             |
| Route components                       | PascalCase ending in `Page`. Lists are plural, single records are `XxxDetailsPage`, forms start with `Add`, `Create` or `Edit`. | `ClientsPage`, `ClientDetailsPage`, `EditClientPage` |
| Other components                       | PascalCase, with the component named like its file                                                      | `components/PageHeader.jsx`                           |
| A page's stylesheet                    | Same name as the page                                                                                   | `ClientsPage.scss`                                    |
| A stylesheet shared by a feature       | camelCase                                                                                               | `clients.scss`, `serviceRequests.scss`                |
| Non-component modules                  | camelCase                                                                                               | `httpClient.js`, `utils/debounce.js`                  |
| API modules                            | `<resource>Api.js` in `services/api/`                                                                   | `bookingApi.js`                                       |
| Images                                 | kebab-case                                                                                              | `assets/images/logo-mark.png`                         |

### Imports

Use the `@/` alias, which points at `src/`, for anything outside the current feature folder. Use relative `./` paths only within the same feature folder. Import a default export under the file's name, for example `import ClientScopeBuilder from ".../ClientScopeBuilder"`.

### Styling

- Colors, spacing, radii, shadows and fonts come from the CSS variables in `src/index.css`. Write `var(--color-...)` and don't hard-code hex values. antd picks up the same tokens through `src/theme/antdTheme.js`, so its components match automatically.
- The brand colors are primary `#78E8F7` and secondary `#08F621`. Both are light, so:
  - Text on a brand fill uses `--color-on-primary` or `--color-on-secondary`.
  - Brand-colored text on white uses `--color-primary-strong` or `--color-secondary-strong`, which keeps it readable (WCAG AA).
- Pages are lazy-loaded, so a page's stylesheet only loads with that page. If two features need the same styles, put them in `src/styles/` and import them from both. Don't rely on another page's CSS happening to be on the page.

### Adding a page

1. Create `src/pages/<feature>/<Name>Page.jsx`.
2. Register it in `src/routes/AppRoutes.jsx` with `lazy(() => import("@/pages/<feature>/<Name>Page"))`, and add a `<Route>` inside the `MainLayout` route.
3. If it needs a sidebar entry, add one in `src/layouts/MainLayout.jsx`.
4. Call the backend through a module in `src/services/api/`, never with raw `fetch` or a new axios instance.
