Render deployment steps

1. Create a new Web Service on Render
   - Connect your GitHub repo `2k23cse176-cell/HELL-ON-TOP`
   - Select the `license-server` directory as the root (or use monorepo settings)
   - Environment: Docker
   - Dockerfile path: `license-server/Dockerfile`
   - Build command: leave blank (Docker will build)
   - Start command: leave blank

2. Create a Managed Postgres on Render (recommended)
   - In Render dashboard, create a new Database -> PostgreSQL
   - Note the DATABASE_URL in the dashboard

3. Set environment variables for the Web Service
   - `DATABASE_URL` = the Postgres connection string from step 2
   - (optional) `DB_SSL` = `true` if your Postgres requires SSL

4. Deploy: Render will build and start the container. The admin UI will be at `https://<your-service>.onrender.com/admin.html`.

Note: If you prefer to use SQLite for testing, leave `DATABASE_URL` unset — the server will use local `licenses.db` (not shared across instances).
