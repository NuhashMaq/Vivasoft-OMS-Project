# OMS2 Frontend

React + TypeScript UI for the OMS2 project workspace.

## Live URL

- https://attachment-project-vivasoft.onrender.com

## Stack

- React + TypeScript + Vite
- Nginx static hosting with API reverse proxy

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create a `.env` file in this folder (or set in Render):

```
VITE_API_URL=/api/v1
VITE_RAG_API_URL=/rag/v1
```

These values are relative because Nginx proxies `/api` and `/rag` to the backend and RAG services.

## Build

```bash
npm run build
```

## Demo Credentials

- superadmin@oms2.local / password
- admin@oms2.local / password
- demo.employee.01@oms2.local / password
