# Prisma migrations

SQL folders in this directory (`20260221…`, `20260912…`) are the **Prisma ORM 7** history that created the current PostgreSQL schema.

Prisma ORM 8 does not apply these folders. New schema changes go through:

- `prisma contract emit`
- `prisma db update` (dev) or `prisma migration plan` + `prisma db migrate` (checked-in files under `prisma/orm8-migrations/app/`)
