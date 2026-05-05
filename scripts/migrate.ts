import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const filePath = path.join(process.cwd(), 'assets_data.json');
  if (!fs.existsSync(filePath)) {
    console.error('assets_data.json not found');
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const assets = JSON.parse(rawData);

  console.log(`Starting migration of ${assets.length} assets...`);

  // Map local data to Supabase structure
  // Note: We don't map the 'id' because Supabase will generate a new serial ID
  // to avoid conflicts and maintain clean indexing, unless you want to keep exact IDs.
  // Given these are timestamps, we can try to insert them if the column is NOT identity.
  // But usually, it's better to let Supabase handle it.
  
  const toInsert = assets.map((a: any) => ({
    title: a.title,
    fileUrl: a.fileUrl,
    tags: a.tags,
    // We can't easily set created_at without a dedicated column, 
    // but if we had one we'd use new Date(a.id).toISOString()
  }));

  // Chunk inserts to avoid payload limits
  const chunkSize = 50;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('assets').insert(chunk);
    
    if (error) {
      console.error(`Error inserting chunk ${i}-${i + chunkSize}:`, error);
    } else {
      console.log(`Inserted chunk ${i}-${i + chunkSize}`);
    }
  }

  console.log('Migration completed!');
}

migrate();
