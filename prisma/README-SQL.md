# Database Setup via SQL Editor

Since Prisma migrations are having connection issues, you can set up the database manually using Supabase SQL Editor.

## Steps:

### 1. Clear All Tables
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `reset-database.sql`
4. Click **Run** to execute
5. This will drop all existing tables

### 2. Create All Tables
1. Still in SQL Editor, clear the editor
2. Copy and paste the contents of `create-tables.sql`
3. Click **Run** to execute
4. This will create all tables with proper relationships

### 3. Verify
After running both scripts, you should see all these tables in your database:
- Plan
- Client
- User
- DeliveryExpected
- WarehouseOrder
- Address
- ShipmentOrder
- ShipmentItem
- Invoice
- Media
- ChangeLog

### 4. Generate Prisma Client
After the tables are created, run this in your terminal to generate the Prisma client:

```bash
npx prisma generate
```

This will create the TypeScript types based on your schema, allowing your Next.js app to work with the database.

## Notes:
- The SQL scripts handle foreign key constraints properly
- All indexes are created for better query performance
- ENUM types are created automatically
- Timestamps default to current time

## Troubleshooting:
If you get foreign key constraint errors:
1. Make sure you ran `reset-database.sql` first to clear everything
2. Check if there are any remaining tables in the Supabase dashboard
3. Manually drop any remaining tables that might be causing conflicts

