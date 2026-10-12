# Loan Approval System Frontend

This frontend supports the Enterprise Loan Approval & Credit Risk Assessment project. It provides login, registration, applicant workflows, officer review, and admin dashboard views for the Spring Boot API.

## Environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The required variable is:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

For deployment to a static host, configure the same value in the hosting environment and ensure the backend allows the frontend origin via CORS.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Notes

- The frontend reads and stores the JWT in `sessionStorage`.
- Role-based navigation depends on the backend returning a trustable role claim or JWT claim.
- The app uses the backend endpoints documented for the project, including `/api/auth/login`, `/api/auth/register`, `/api/loans/applications/my`, `/api/loans/applications/pending`, and `/api/admin/dashboard`.
- The current project uses a small default loan-type mapping for `PERSONAL`, `HOME`, and `EDUCATION` IDs when the backend does not expose a listing endpoint.
