
async function checkSupabase() {
  const url = 'https://knrcqovuxkwxafsmirm.supabase.co/rest/v1/';
  console.log(`Checking Supabase URL: ${url}`);
  
  try {
    const res = await fetch(url, { method: 'GET' });
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Text: ${await res.text()}`);
  } catch (err) {
    console.error(`Error fetching Supabase: ${err.message}`);
    if (err.message.includes('getaddrinfo')) {
      console.error('DNS Lookup failed. The domain does not exist or is unreachable.');
    }
  }
}

checkSupabase();
