# PERN Stack Scaffold

## Structure

- `client/` - Next.js frontend with Tailwind CSS
- `server/` - Express backend + Prisma

## Run

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npm run dev
```

## Notes
- Frontend and backend are separated.
- Client now uses **Next.js** instead of plain React and is styled with **Tailwind CSS**.
- Prisma schema is under `server/prisma/schema.prisma`.
- Add your routes/controllers/services under `server/src`.
