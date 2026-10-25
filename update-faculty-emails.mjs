import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing Supabase environment variables.');
  console.error('Supabase URL found:', Boolean(supabaseUrl));
  console.error('Secret key found:', Boolean(supabaseSecretKey));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Keep your existing facultyUpdates array and update loop below.


// Replace these placeholders with the actual faculty Auth user IDs
// and their verified, intended institutional email addresses.
const facultyUpdates = [
  {
    id: '07b877df-47fd-4e6a-acbc-0cd4351a70c6',
    email: 'anitharaghavendra@nie.ac.in',
  },
  {
    id: 'ed172e51-48b0-4a1d-b6fd-207d2ca7af8e',
    email: 'nishanthr@nie.ac.in',
  },
  {
    id: 'e00a909a-a858-4023-b319-da26ddf72e69',
    email: 'manojnsogi@nie.ac.in',
  },
  {
    id: '89f789a6-57d3-4e40-9a7c-1ccf21d1d7a6',
    email: 'kavithas@nie.ac.in',
  },
  {
    id: '9100dfa1-f7d8-4217-9b7e-4d7ea9cb58e8',
    email: 'snehas@nie.ac.in',
  },
  {
    id: '181354ea-89c0-4e0d-bd7f-78c775202953',
    email: 'deepashreem@nie.ac.in',
  },
  {
    id: '9ab75523-8fb7-4e8c-a4e3-fd7d38a2ebac',
    email: 'kmaishwarya@nie.ac.in',
  },
  // Add the remaining five faculty accounts.
];

for (const faculty of facultyUpdates) {
  const { data, error } =
    await supabase.auth.admin.updateUserById(faculty.id, {
      email: faculty.email,
    });

  if (error) {
    console.error(`Failed: ${faculty.email}`, error.message);
    continue;
  }

  console.log(`Updated Auth email: ${data.user.email}`);
}