# Docker-first (recommended)

This project is built to run with Docker Compose by default. Docker ensures every contributor (and CI) runs the same environment, so the Docker path below is the recommended and tested flow.

## Quick Docker-first steps (recommended)

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Install Node dependencies (required for the API image build step):

```bash
npm install
```

3. Build and start services (Postgres + API):

```bash
docker compose up -d --build
```

4. Verify the API is ready:

```bash
curl http://localhost:3000/health
# expect: {"status":"ok"}
```

5. Run Playwright tests:

```bash
npm test
```

6. When finished, stop services. Use `-v` if you want to remove the database data (wipes DB):

```bash
docker compose down        # stop but keep volumes (data persists)
docker compose down -v     # stop and remove volumes (reset DB)
```

---

## Docker installation

If Docker is not installed, install Docker Desktop for your platform.

### macOS

1. Download: https://www.docker.com/products/docker-desktop/
2. Install the .dmg file and follow the installer
3. Start Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

### Windows

1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. Docker Desktop requires WSL2 on Windows 10/11; the installer will prompt to enable/install WSL if needed. Follow the installer steps.
3. Start Docker Desktop from the Start menu
4. Verify installation in PowerShell or Command Prompt:
   ```powershell
   docker --version
   docker compose version
   ```
   4a. If you use WSL, ensure your distro is running and that Docker Desktop is configured to use the WSL backend.

---

## Local Postgres (alternative — not recommended)

If you cannot use Docker, you can run Postgres locally and run the API directly. This is an alternate path and requires manually installing and managing the database and environment.

### Steps (local Postgres)

1. Install and start Postgres (example using Homebrew):

```bash
brew install postgresql@16
brew services start postgresql@16
```

2. Create a database and user (psql):

```bash
psql postgres
CREATE USER api_user WITH PASSWORD 'api_pass';
CREATE DATABASE fintech_api OWNER api_user;
\q
```

3. Update `.env` from the example and point `DATABASE_URL` to `localhost`:

```bash
cp .env.example .env
# Edit .env and change DATABASE_URL:
DATABASE_URL=postgresql://api_user:api_pass@localhost:5432/fintech_api
```

4. Run migrations, seed, and start the API locally:

```bash
npm run migrate
npm run seed
npm run dev
```

5. Run tests:

```bash
npm test
```

### Local Postgres on Windows (alternative)

If you prefer to run Postgres directly on Windows instead of using Docker or WSL, use the official installer:

1. Download the installer: https://www.postgresql.org/download/windows/
2. Run the installer and follow prompts (remember the superuser password)
3. Create the `api_user` and `fintech_api` database using `psql` or pgAdmin

Example using `psql` (from the installer shell or `psql` in PATH):

```powershell
psql -U postgres
CREATE USER api_user WITH PASSWORD 'api_pass';
CREATE DATABASE fintech_api OWNER api_user;
\q
```

Then update `.env` as shown above and run migrations/seed.

---

## Notes

- The Docker path is the primary workflow for this repository and the one CI uses. The local Postgres path is provided as an alternative for developers who cannot run Docker.
- Use `docker compose down -v` only when you intentionally want to wipe the database volume (for a clean slate).

## ✅ What Was Completed in Phase 0

Even without Docker running, all the code is ready:

- ✅ Project structure created
- ✅ TypeScript configuration
- ✅ Express API setup
- ✅ Database migrations and seed scripts
- ✅ Health endpoint
- ✅ Playwright test configuration
- ✅ Docker Compose setup (ready to use when Docker is installed)
- ✅ Learning guide documentation

**Next step:** Install Docker Desktop, then run `docker compose up -d --build`
