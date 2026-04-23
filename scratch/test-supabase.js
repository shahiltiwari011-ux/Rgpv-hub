import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knrcqovuxkwxafsmirm.supabase.co';
const supabaseKey = 'sb_publishable_MXq5SQESXs_BYZpx0TK4oA_fJF-A6MM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('resources').select('id').limit(1);
        if (error) {
            console.error('❌ Supabase Error:', error.message);
        } else {
            console.log('✅ Supabase Success:', data);
        }
    } catch (err) {
        console.error('❌ Fetch Error:', err.message);
    }
}

test();
