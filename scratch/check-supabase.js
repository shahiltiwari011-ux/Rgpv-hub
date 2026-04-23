// Node 24 has built-in fetch


async function checkSupabase() {
    const url = 'https://knrcqovuxkwxafsmirm.supabase.co/rest/v1/resources?select=count';
    const key = 'sb_publishable_MXq5SQESXs_BYZpx0TK4oA_fJF-A6MM';
    
    try {
        console.log('Fetching from Supabase...');
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        const data = await response.json();
        console.log('Data:', data);
    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

checkSupabase();
