
import express from 'express';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Fix for "self-signed certificate in certificate chain" error
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const app = express();
const PORT = 3000;

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

// Lazy pool initialization — avoids crashes if env vars are missing at import time
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new pg.Pool({
      ...poolConfig,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
  }
  return _pool;
}

app.use(express.json({ limit: '10mb' }));

// --- API ROUTES ---

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await getPool().query('SELECT NOW()');
    res.json({
      status: 'ok',
      dbTime: result.rows[0],
      env: {
        DB_HOST: process.env.DB_HOST ? 'Present' : 'Missing',
        DB_PORT: process.env.DB_PORT ? 'Present' : 'Missing',
        DB_NAME: process.env.DB_NAME ? 'Present' : 'Missing',
        DB_USER: process.env.DB_USER ? 'Present' : 'Missing',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'Present' : 'Missing',
        DATABASE_URL: process.env.DATABASE_URL ? 'Present' : 'Missing',
        NODE_ENV: process.env.NODE_ENV
      },
      url: req.url,
      originalUrl: req.originalUrl
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      env: {
        DB_HOST: process.env.DB_HOST ? 'Present' : 'Missing',
        DB_PORT: process.env.DB_PORT ? 'Present' : 'Missing',
        DB_NAME: process.env.DB_NAME ? 'Present' : 'Missing',
        DB_USER: process.env.DB_USER ? 'Present' : 'Missing',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'Present' : 'Missing',
        DATABASE_URL: process.env.DATABASE_URL ? 'Present' : 'Missing',
        NODE_ENV: process.env.NODE_ENV
      },
      url: req.url,
      originalUrl: req.originalUrl
    });
  }
});

// Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Hardcoded Super Admin Bypass for Pita Domingos
  if ((username === 'Pita Domingos' || username === 'pita.domingos@jachris.com') && password === 'native@13035') {
    return res.json({
        status: 'success',
        user: {
          id: 1337,
          name: 'Pita Domingos',
          email: 'pita.domingos@jachris.com',
          role: 'System Admin',
          status: 'Active',
          company: 'CARS Global',
          companyId: null,
          jobTitle: 'Global Administrator'
        }
    });
  }

  try {
    const result = await getPool().query(
      'SELECT u.*, c.name as company_name, c.logo_url as company_logo, c.gps_coordinates as company_gps, c.registration_date, c.is_paid, c.selected_modules FROM public.users u LEFT JOIN public.companies c ON u.company_id = c.id WHERE u.email = $1 AND u.password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Global Admin Bypass (Pita Domingos)
      const isGlobalAdmin = user.email === 'pita.domingos@jachris.com' || user.name === 'Pita Domingos';
      
      if (!isGlobalAdmin && user.company_id) {
        const registrationDate = user.registration_date ? new Date(user.registration_date) : new Date();
        const isPaid = user.is_paid === true;
        
        if (!isPaid) {
          // Calculate 14 working days
          // A working day is Mon-Fri. 14 working days is approx 18-20 calendar days.
          // Let's implement a simple loop to calculate exactly 14 working days.
          let workingDaysCount = 0;
          let currentDate = new Date(registrationDate);
          while (workingDaysCount < 14) {
            currentDate.setDate(currentDate.getDate() + 1);
            const day = currentDate.getDay();
            if (day !== 0 && day !== 6) { // Not Sunday or Saturday
              workingDaysCount++;
            }
          }
          
          const now = new Date();
          if (now > currentDate) {
            return res.status(403).json({ 
              status: 'trial_expired', 
              message: 'Your company\'s trial period has expired. Please contact your company administrator to arrange payment for full access.' 
            });
          }
        }
      }

      res.json({
        status: 'success',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (isGlobalAdmin && !user.company_id) ? 'System Admin' : user.role,
          status: user.status,
          company: user.company_name,
          companyId: user.company_id,
          companyLogo: user.company_logo,
          companyGpsCoordinates: user.company_gps,
          selectedModules: user.selected_modules || [],
          jobTitle: user.job_title,
          department: user.department,
          siteId: user.site_id,
          appModule: user.app_module
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
  } catch (err: any) {
    console.error('Auth error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Registration endpoint: Step 1 (Company)
app.post('/api/register-company', async (req, res) => {
  const { name, address, gpsCoordinates, contactPerson, contactCell, contactEmail, logo, selectedModules } = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO public.companies 
       (name, address, gps_coordinates, contact_person, contact_cell, contact_email, logo_url, app_name, tier, status, selected_modules) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $1, 'Prime', 'Active', $8) 
       RETURNING id, name, logo_url, selected_modules`,
      [name, address, gpsCoordinates, contactPerson, contactCell, contactEmail, logo, JSON.stringify(selectedModules || [])]
    );
    res.json({ success: true, company: result.rows[0] });
  } catch (err: any) {
    console.error('Company registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registration endpoint: Step 2 (User)
app.post('/api/register-user', async (req, res) => {
  const { name, email, password, jobTitle, role, phoneNumber, department, companyId } = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO public.users 
       (name, email, password, job_title, role, phone_number, department, company_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active') 
       RETURNING id, name, email`,
      [name, email, password, jobTitle, role, phoneNumber, department, companyId]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    console.error('User registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generic proxy for other databaseService calls
app.get('/api/companies', async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM public.companies ORDER BY name');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  const { is_paid, tier, status, name, selected_modules } = req.body;
  try {
    const result = await getPool().query(
      'UPDATE public.companies SET is_paid = COALESCE($1, is_paid), tier = COALESCE($2, tier), status = COALESCE($3, status), name = COALESCE($4, name), selected_modules = COALESCE($5, selected_modules) WHERE id = $6 RETURNING *',
      [is_paid, tier, status, name, selected_modules ? JSON.stringify(selected_modules) : null, id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM public.users ORDER BY name');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees', async (req, res) => {
    try {
      const result = await getPool().query('SELECT * FROM public.employees ORDER BY name');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
      const result = await getPool().query('SELECT * FROM public.training_sessions ORDER BY date DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
      const result = await getPool().query(`
        SELECT r.*, e.record_id as employee_record_id, e.name as employee_name, e.company as employee_company
        FROM public.records r
        LEFT JOIN public.employees e ON r.employee_id = e.id
        ORDER BY r.created_at DESC
      `);
      // Map to frontend structure
      const bookings = result.rows.map(r => ({
        ...r,
        employee: {
          id: r.employee_id,
          recordId: r.employee_record_id,
          name: r.employee_name,
          company: r.employee_company
        }
      }));
      res.json(bookings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

app.get('/api/sites', async (req, res) => {
    try {
      const result = await getPool().query('SELECT * FROM public.sites ORDER BY name');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

app.get('/api/waitlist', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.waiting_list ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/requirements', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.employee_requirements');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/rooms', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.rooms ORDER BY name');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/trainers', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.trainers ORDER BY name');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/connectors', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.data_connectors');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/recruitment-processes', async (req, res) => {
    try {
        const result = await getPool().query('SELECT * FROM public.recruitment_processes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
      const result = await getPool().query('SELECT * FROM public.system_logs ORDER BY timestamp DESC LIMIT 100');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    const { level, message_key, user_name, metadata } = req.body;
    try {
      await getPool().query(
        'INSERT INTO public.system_logs (level, message_key, user_name, metadata) VALUES ($1, $2, $3, $4)',
        [level || 'INFO', message_key, user_name, metadata || {}]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

// SafeMap Module Endpoints
app.get('/api/unsafe-conditions', async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM public.unsafe_conditions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unsafe-conditions', async (req, res) => {
  const body = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO public.unsafe_conditions (
        id, latitude, longitude, function_location, condition_type, responsible_area, 
        description, action_plan, initial_photos, correction_photos, observer_id, 
        observer_name, ssma_focal_point_id, ssma_focal_point_name, area_responsible_id, 
        area_responsible_name, area_manager_id, area_manager_name, state, map_status, 
        severity, resolved_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      ON CONFLICT (id) DO UPDATE SET
        description=EXCLUDED.description, action_plan=EXCLUDED.action_plan,
        correction_photos=EXCLUDED.correction_photos, state=EXCLUDED.state,
        map_status=EXCLUDED.map_status, resolved_at=EXCLUDED.resolved_at,
        ssma_focal_point_id=EXCLUDED.ssma_focal_point_id, ssma_focal_point_name=EXCLUDED.ssma_focal_point_name,
        area_responsible_id=EXCLUDED.area_responsible_id, area_responsible_name=EXCLUDED.area_responsible_name,
        area_manager_id=EXCLUDED.area_manager_id, area_manager_name=EXCLUDED.area_manager_name,
        severity=EXCLUDED.severity
      RETURNING *`,
      [
        body.id, body.latitude, body.longitude, body.function_location, body.condition_type,
        body.responsible_area, body.description, body.action_plan,
        JSON.stringify(body.initial_photos || []), JSON.stringify(body.correction_photos || []),
        body.observer_id, body.observer_name, body.ssma_focal_point_id, body.ssma_focal_point_name,
        body.area_responsible_id, body.area_responsible_name, body.area_manager_id, body.area_manager_name,
        body.state || 'Criado', body.map_status || 'Recente', body.severity || 'Medium', 
        body.resolved_at || null
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/unsafe-conditions/:id', async (req, res) => {
  try {
    await getPool().query('DELETE FROM public.unsafe_conditions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for missing API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Dev-only server startup — fully isolated from production bundle
if (process.env.NODE_ENV !== "production") {
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })();
}

export default app;
