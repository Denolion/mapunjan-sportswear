# MAPUNJAN SPORTS WEAR

Premium storefront for original team kits and sportswear, with public ordering and an authenticated administrator workspace.

## Run locally

1. Install dependencies.
2. Create a Supabase project.
3. Copy `.env.example` to `.env` and add the project URL and anon key.
4. Open Supabase Dashboard → SQL Editor → New Query, paste the complete contents of `supabase_schema.sql`, and run it once.
5. In Supabase Authentication, create the administrator email/password account.
6. Copy the administrator Auth user UUID, then run:

```sql
insert into public.admin_users (user_id) values ('PASTE_AUTH_USER_UUID_HERE');
```

7. Start the application.
8. Build for production with `npm run build`.
9. Deploy the generated `dist` folder.

Customers browse and order as guests. Only an Auth user listed in `admin_users` can use `/admin`. Customer totals are calculated inside Supabase from the current product price. Product images belong in the `product-images` storage bucket created by the SQL script. Public WhatsApp ordering uses a normal click-to-chat link.
