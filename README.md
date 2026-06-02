# JenPark Web

Public-facing web application for the **JenPark** platform by **Jenx AI Technologies**.

> Production-ready scaffold. Business modules are intentionally **not** implemented — this is the foundation for the internship team.

---

## Project Overview

`jenpark-web` is the customer-facing React SPA where end users sign in, manage their vehicles, view active parking sessions, and pay for bookings. It consumes the `jenpark-backend` REST API.

## Tech Stack

| Layer       | Technology         |
| ----------- | ------------------ |
| Framework   | React 18           |
| Bundler     | Vite               |
| UI          | Material UI (MUI)  |
| State       | Redux Toolkit      |
| Routing     | React Router v6    |
| HTTP        | Axios              |

## Folder Structure

```
src/
├── main.jsx              # Entry: Provider + Theme + Router
├── App.jsx               # Mounts <AppRoutes />
├── api/
│   ├── axios.js          # Axios instance + interceptors
│   └── endpoints.js      # URL constants
├── components/           # Reusable UI (Navbar, Footer, …)
├── hooks/                # Custom hooks (useAuth, …)
├── layouts/              # MainLayout = Navbar + content + Footer
├── pages/                # Login, Dashboard, VehicleList, …
├── routes/               # Route table + ProtectedRoute guard
├── services/             # Feature API services
├── store/
│   ├── index.js          # configureStore
│   └── slices/           # auth, vehicles, …
├── theme/                # MUI theme override
└── utils/                # Pure helpers
```

## Installation

```bash
git clone https://github.com/jenxtech/jenpark-web.git
cd jenpark-web
npm install
cp .env.example .env
```

## Development Commands

```bash
npm run dev      # vite dev server (http://localhost:5174)
npm run build    # production bundle
npm run preview  # serve the build
npm run lint     # eslint
```

## Environment Variables

| Variable             | Description                              |
| -------------------- | ---------------------------------------- |
| `VITE_API_BASE_URL`  | Backend API base URL                     |
| `VITE_APP_NAME`      | Public app name shown in the UI          |

## Architecture

- `MainLayout` is the **reusable shell** (Navbar + Footer). Every public/private page that lives inside the shell is a child route of `<MainLayout />`.
- `ProtectedRoute` guards any subtree that requires auth. It captures the original location and redirects back after login.
- Axios is configured in `src/api/axios.js` with request/response interceptors (token injection, 401 → logout).
- Each feature owns a Redux slice in `src/store/slices/` and a service module in `src/services/`.

## Coding Standards

- Path alias `@` → `src/`.
- Pages = routed components. Components = reusable presentational pieces.
- API calls live in `services/`, never inside components.
- Use the MUI theme for colors and spacing — no hard-coded values.
- No `console.log` in committed code.

## Branching Strategy

| Branch type | Pattern                  |
| ----------- | ------------------------ |
| Feature     | `feature/<module>`       |
| Bugfix      | `bugfix/<module>`        |
| Hotfix      | `hotfix/<issue>`         |

Mainline: `main`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

UNLICENSED — © Jenx AI Technologies.
