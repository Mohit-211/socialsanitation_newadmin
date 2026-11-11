# Social Sanitation Admin

The admin panel for Social Sanitation. It covers clients, bookings, employees, scheduling, estimates, quotes, invoices, contracts, inspections, supplies and team chat. It is a single-page React app written in TypeScript and built with Vite.

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

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Starts the dev server with hot reload                     |
| `npm run typecheck` | Type-checks the whole project with `tsc -b`               |
| `npm run build`     | Type-checks, then builds for production into `dist/`      |
| `npm run preview`   | Serves the `dist/` build locally                          |
| `npm run lint`      | Runs ESLint (with typescript-eslint)                      |

The dev server doesn't type-check, so run `npm run typecheck` (or watch your editor) as you work. A type error stops `npm run build`.

## Environment variables

Configuration lives in `.env`, which is gitignored. `.env.example` lists every variable with placeholder values.

| Variable                            | Required | Used for                                                                                       |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                      | Yes      | The backend's address with no path, such as `https://api.socialsanitation.com`. The panel calls its `/api/v2` paths and opens uploaded files from it. |
| `VITE_GOOGLE_MAPS_API_KEY`          | Yes      | Google Maps: client and employee maps, guest booking address lookup, geocoding.                |
| `VITE_FIREBASE_API_KEY`             | Yes      | The Firebase web app. The chat screens read messages live from its Realtime Database.          |
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

Code reads these values only through `src/config/env.ts`. Don't use `import.meta.env` anywhere else. A new variable is declared in `src/vite-env.d.ts` too, so its name is checked. Public constants that are the same in every environment, such as the logo URL, live in `src/config/brand.ts`.

## Deploying

1. Set the variables above in your hosting or CI settings. The build fails if a required one is missing.
2. Run `npm run build` and serve the `dist/` folder.
3. The app uses browser routing, so configure the host to serve `index.html` for any path that isn't a file. That includes `/checkout`, where Square sends clients after paying an invoice.

### Going live at panel.socialsanitation.com

- Build with `VITE_API_URL=https://api.socialsanitation.com`.
- The backend must allow the panel's address, `https://panel.socialsanitation.com`, in `ACCESSDOMAINS` (CORS). If it sets `ADMIN_ORIGINS` or `WEB_ORIGINS`, the panel's address goes in those too: the panel calls `/api/v2/admin`, `/api/v2/auth` and `/api/v2/web` (places, payment status).
- Set the backend's `ADMIN_BASE_URL=https://panel.socialsanitation.com`. Square's payment redirect (`/checkout`) and the links in the office's emails are built from it.
- Files uploaded before the move are still linked as `/api/v1/images/<name>` on the API's address, so the API must keep serving that path.
- Restrict the Google Maps key to the panel's address; the address lookups on the employee and booking forms use it.

## Tech stack

| Concern           | Package                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| Language          | TypeScript 6, in strict mode                                                         |
| UI components     | [antd](https://ant.design) 6, themed from the design tokens in `src/index.css`       |
| Icons             | [lucide-react](https://lucide.dev)                                                   |
| Routing           | [react-router](https://reactrouter.com) 8. Import from `react-router`; `react-router-dom` no longer exists. |
| Rich text         | [Tiptap](https://tiptap.dev), wrapped in `src/components/RichTextEditor.tsx`. Images are off unless a page passes `onUploadImage` (the blog does). |
| HTTP              | axios, through the shared clients in `src/services/httpClient.ts`                    |
| Chat              | Firebase Realtime Database for live messages; messages and files are sent through the API |
| Maps              | `@react-google-maps/api`                                                             |
| Dates             | dayjs, with its plugins registered in `src/lib/dayjs.ts`                             |

Each concern uses exactly one package. Don't add a second UI kit, icon set, router or editor next to these.

## Project structure

```
src/
├── main.tsx              App entry: fonts, global styles and the antd theme provider
├── App.tsx               Router setup
├── vite-env.d.ts         Vite's types, and the VITE_ variables the app reads
├── index.css             Design tokens (colors, spacing, radii, shadows, fonts) and global styles
├── routes/AppRoutes.tsx  Every route; pages are lazy-loaded
├── layouts/              MainLayout: sidebar, header and the signed-in shell
├── pages/<feature>/      One folder per feature: clients/, bookings/, invoices/ ...
│   ├── XxxPage.tsx       Route components
│   ├── XxxPage.scss      Styles for that page
│   ├── <feature>.scss    Styles shared by the feature's pages
│   └── components/       Components used only by this feature
├── components/           Shared components (PageHeader, PageLoader, RichTextEditor, SignatureField ...)
├── types/                The API's answers and the shapes screens share, one file per area (clients, sales, billing, bookings ...)
├── services/
│   ├── httpClient.ts     axios clients for /api/v2/admin (adds the session token, sends 401s to sign-in), /auth and /web
│   ├── apiResult.ts      Reading answers: dataOf, itemsOf, pageOf, errorMessage
│   └── api/              One module per backend resource (bookingApi.ts, invoiceApi.ts ...)
├── config/
│   ├── env.ts            Reads and validates the VITE_ variables
│   └── brand.ts          Public brand constants
├── hooks/                Shared React hooks (useApiQuery loads data and reloads it, usePagedList, useRouteParam)
├── lib/                  The signed-in session (session.ts) and third-party setup (Firebase, dayjs)
├── theme/antdTheme.ts    antd theme built from the tokens in index.css
├── styles/               Stylesheets shared across features
├── utils/                Small helpers (dates, file links, downloads, debounce, Excel export, image compression, geocoding)
└── assets/images/        Images bundled with the app

public/
├── favicon.ico, favicon.png, apple-touch-icon.png
└── forms/                Standalone HTML forms, served as-is outside the React app
```

## The client page

A client's page (`/viewUser/:id`) is where the office works a client from first enquiry to paid invoice, without going back to separate lists. Its tabs follow the order of the work: enquiries, client sheets, scopes of work, calculations, estimates, quotes, service requests, contracts, bookings and invoices.

- Every "New" button opens its form with the client already chosen, and saving comes back to the client's tab (`?clientId=` on the form's address; see `src/pages/clients/clientFlow.ts`).
- Each step hands on to the next with what it knows: price a scope in the calculator, make an estimate or quote from a calculation, a quote from an estimate, an invoice from a quote or a contract.
- A service request can add to one of the client's estimates or quotes: its lines join that document, which goes to the client again, and the request isn't sent on its own (a paid quote takes no new lines, so its request goes alone).
- When the client signs an estimate, a draft contract appears on the Contracts tab, with a monthly price worked out from the estimate's recurring lines when the backend can read them: open it, check or set the price and date, and save to send it for signature. A signed contract shows what the client filled in (start date and time, service days, payment method).
- Opening a document from the client page and saving it also comes back there.

## Conventions

### Naming

| What                                   | Convention                                                                                              | Example                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Feature folders                        | kebab-case                                                                                              | `pages/service-requests/`                             |
| Route components                       | PascalCase ending in `Page`. Lists are plural, single records are `XxxDetailsPage`, forms start with `Add`, `Create` or `Edit`. | `ClientsPage`, `ClientDetailsPage`, `EditClientPage` |
| Other components                       | PascalCase, with the component named like its file                                                      | `components/PageHeader.tsx`                           |
| A page's stylesheet                    | Same name as the page                                                                                   | `ClientsPage.scss`                                    |
| A stylesheet shared by a feature       | camelCase                                                                                               | `clients.scss`, `serviceRequests.scss`                |
| Non-component modules                  | camelCase                                                                                               | `httpClient.ts`, `utils/debounce.ts`                  |
| API modules                            | `<resource>Api.ts` in `services/api/`, exporting camelCase verbs                                        | `bookingApi.ts` with `listBookings`, `getBooking`     |
| Images                                 | kebab-case                                                                                              | `assets/images/logo-mark.png`                         |

### TypeScript

- The compiler settings are in `tsconfig.app.json` (the app) and `tsconfig.node.json` (`vite.config.ts`); `tsconfig.json` only points at both. They are strict, and unused variables and parameters are errors: name a parameter you don't use `_name`.
- Answers from the API have types in `src/types/`, one file per area, all importable from `@/types`. Base them on what the backend's mappers send, and change them when the API changes.
- Each API function says what its call answers, such as `(id: Id): ApiCall<Quote>`, so `dataOf` and `pageOf` hand back typed values with no casting.
- A shape only one feature uses, such as a form's working copy, lives beside its pages (`pages/service-quotes/quoteForm.ts`).
- Import types with `import type` (the compiler requires it). Don't use `any`, `@ts-ignore` or `as unknown as`: narrow the value with a check instead.
- Read route parameters with `useRouteParam()` (`useRouteParam("booking_id")` for another name); it answers a string.
- Give antd tables their row type, `const columns: TableColumnsType<Quote> = [...]`, and `render` gets typed rows.

### Imports

Use the `@/` alias, which points at `src/`, for anything outside the current feature folder. Use relative `./` paths only within the same feature folder. Import a default export under the file's name, for example `import ClientScopeBuilder from ".../ClientScopeBuilder"`.

### Styling

- Colors, spacing, radii, shadows and fonts come from the CSS variables in `src/index.css`. Write `var(--color-...)` and don't hard-code hex values. antd picks up the same tokens through `src/theme/antdTheme.ts`, so its components match automatically.
- The brand colors are primary `#78E8F7` and secondary `#08F621`. Both are light, so:
  - Text on a brand fill uses `--color-on-primary` or `--color-on-secondary`.
  - Brand-colored text on white uses `--color-primary-strong` or `--color-secondary-strong`, which keeps it readable (WCAG AA).
- Pages are lazy-loaded, so a page's stylesheet only loads with that page. If two features need the same styles, put them in `src/styles/` and import them from both. Don't rely on another page's CSS happening to be on the page.

### Talking to the backend

- Every call goes to `/api/v2` on `VITE_API_URL`. API modules use paths relative to the admin side, such as `httpClient.get("/clients/12")`; the client adds the session token itself.
- Read answers with `dataOf`, `itemsOf` and `pageOf` from `src/services/apiResult.ts`. Lists are paged (`page`, `limit`, at most 50 rows) and answer `{ items, pagination }`.
- Show `errorMessage(error)` when a call fails: the backend's own message says what went wrong.
- Load a page's data with `useApiQuery`, which reloads when its inputs change and ignores late answers.
- Dates go to the API as `YYYY-MM-DD` and times as 24-hour `HH:mm`; people see `MM/DD/YYYY` and `h:mm AM`, in Eastern time. Use the helpers in `src/utils/datetime.ts`.

### Who can do what

The sign-in answer carries the admin's `roles` and `permissions`, kept by `src/lib/session.ts`. Show a button only when the admin may use it, with `useCan(PERMISSION.DELETE_RECORDS)` and the like, and never check role numbers. The backend refuses anything else with a 403 whose message the screen shows.

### Adding a page

1. Create `src/pages/<feature>/<Name>Page.tsx`.
2. Register it in `src/routes/AppRoutes.tsx` with `lazy(() => import("@/pages/<feature>/<Name>Page"))`, and add a `<Route>` inside the `MainLayout` route.
3. If it needs a sidebar entry, add one in `src/layouts/MainLayout.tsx`.
4. Call the backend through a module in `src/services/api/`, never with raw `fetch` or a new axios instance.
