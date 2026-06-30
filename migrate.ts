
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Fix for SSL certificate chain issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // 1. Update companies table
    await client.query(`
      ALTER TABLE public.companies 
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS gps_coordinates VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_cell VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS selected_modules JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Updated companies table with trial and modules fields.');

    // 2. Update users table
    await client.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    `);
    console.log('Updated users table.');

    // 3. Ensure other tables have tenant_id (company_id) if needed
    // For this RAC system, most things are already linked to company_id or site_id (which links to company_id)
    // But let's check employees
    await client.query(`
      ALTER TABLE public.employees 
      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    `);
    console.log('Updated employees table.');

    // 4. Update unsafe_conditions table
    await client.query(`
      ALTER TABLE public.unsafe_conditions 
      ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Unsafe Condition' CHECK (category IN ('Unsafe Condition', 'Unsafe Act', 'Near Miss', 'Positive Observation'));
    `);
    console.log('Updated unsafe_conditions table with severity and category columns.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
