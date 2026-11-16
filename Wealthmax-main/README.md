# WealthMax

WealthMax is a comprehensive wealth management application featuring a robust Node.js/Express backend and a modern React/Vite frontend.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** database (or a Supabase account for cloud Postgres)

---

## Project Structure

The repository is divided into two main parts:
- `backend/`: Node.js, Express, TypeScript, PostgreSQL
- `frontend/`: React, Vite, TypeScript, TailwindCSS, shadcn/ui

---

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the example environment file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure the necessary variables:
   - `DATABASE_URL`: Your PostgreSQL connection string. (e.g., Supabase Postgres URI).
   - `JWT_SECRET`: A secure random string for JWT token generation.
   - `ENCRYPTION_KEY`: A 32-character string for AES-256 encryption.
   - `CORS_ORIGIN`: Set to your frontend URL (default is `http://localhost:5174` or `http://localhost:5173`).
   - Configure SMTP settings if you need email/OTP functionality.

4. **Database Migrations:**
   Apply the database migrations to set up your schema:
   ```bash
   npm run migrate:up
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The backend should now be running (default: http://localhost:5000).

---

## Frontend Setup

1. **Navigate to the frontend directory:**
   Open a new terminal window/tab and run:
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the `frontend` root directory and add the following variables:
   ```env
   VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
   VITE_SUPABASE_URL="https://your_supabase_project.supabase.co"
   VITE_API_BASE_URL="http://localhost:5000/api/v1"
   ```
   *(Ensure `VITE_API_BASE_URL` matches your local backend URL).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The frontend should now be running on the URL provided in the terminal (usually http://localhost:5173 or http://localhost:5174).

---

## Running the Application

To run the application locally, you will need to keep both the backend and frontend development servers running simultaneously in separate terminal windows.

1. Terminal 1: `cd backend && npm run dev`
2. Terminal 2: `cd frontend && npm run dev`

Open your browser and navigate to the frontend URL to start using WealthMax.
