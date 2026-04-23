
import dns from 'node:dns';

const domain = 'knrcqovuxkwxafsmirm.supabase.co';

dns.lookup(domain, (err, address, family) => {
  if (err) {
    console.error(`DNS lookup failed for ${domain}:`, err.message);
  } else {
    console.log(`Address: ${address}, Family: IPv${family}`);
  }
});
