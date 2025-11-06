# Quick Setup Guide

## 1. Database Configuration

Update `.env` file with your Supabase database password:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ewqthhqjxxujpcmjtfme.supabase.co:5432/postgres"
```

**How to get password:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings > Database
4. Find "Database password" section
5. Copy the password (or reset if needed)

## 2. Generate NextAuth Secret

Generate a secure random secret:

```bash
openssl rand -base64 32
```

Or use an online generator. Add to `.env`:

```
NEXTAUTH_SECRET="your-generated-secret-here"
```

## 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 4. Create First Admin User

You can create an admin user through Prisma Studio or create a script:

```bash
npx prisma studio
```

In Prisma Studio:
1. Create a User with role = ADMIN
2. Set email and passwordHash (use bcrypt to hash password)
3. Or use the API: POST `/api/auth/register` with role: "ADMIN"

## 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## 6. Create Test Data

After logging in as admin, you can:
- Create clients
- Assign plans
- Test the full workflow

## Notes

- Photo uploads are currently stubs - implement cloud storage (S3, Cloudinary) for production
- Revolut payment integration is stubbed - implement real API for production
- Email notifications are stubbed - implement SMTP/email service for production

