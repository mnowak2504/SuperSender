# Seed Plans Instructions

To add the default plans (Basic, Pro, Enterprise) to your database, you have two options:

## Option 1: Using the API Endpoint (Recommended)

1. Log in as an ADMIN or SUPERADMIN user
2. Make a POST request to `/api/admin/plans/seed`

You can do this using:
- **Browser Console**: 
  ```javascript
  fetch('/api/admin/plans/seed', { method: 'POST' })
    .then(r => r.json())
    .then(console.log)
  ```
- **cURL**:
  ```bash
  curl -X POST http://localhost:3000/api/admin/plans/seed \
    -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
  ```

## Option 2: Using the Script

Run the Node.js script:

```bash
node scripts/seed-plans.js
```

Make sure you have the following environment variables set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Plans Created

The script will create three plans:

1. **Basic**
   - €99/month
   - 5 deliveries per month
   - 10 CBM storage limit
   - €15/CBM over limit

2. **Pro**
   - €299/month
   - 15 deliveries per month
   - 50 CBM storage limit
   - €12/CBM over limit

3. **Enterprise**
   - Custom pricing
   - Unlimited deliveries
   - Unlimited storage
   - €10/CBM over limit
   - Includes: Dedicated account manager, Priority support, Custom integrations
   - Shows "Contact Us" CTA button

## Notes

- The script will skip plans that already exist (based on name)
- Only ADMIN and SUPERADMIN users can seed plans via the API
- Plans are ordered by price (ascending) in the upgrade page

