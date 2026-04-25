import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Production Middleware
app.set('trust proxy', 1); // Trust first proxy (Railway/Vercel)
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP if frontend is separate, or configure properly
}));
app.use(compression());
app.use(morgan('combined'));

const frontendUrl = process.env.FRONTEND_URL || '*';
app.use(cors({
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

let supabase = null;
console.log('------------------------------------');
console.log('🚀 SYSTEM: Checking Supabase Configuration...');

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        console.log('✅ SYSTEM: Supabase Client Initialized Successfully');
    } catch (err) {
        console.error('❌ SYSTEM: Supabase Initialization Failed:', err.message);
    }
} else {
    console.error('❌ SYSTEM: Supabase URL or Key is MISSING in Environment Variables');
    if (!process.env.SUPABASE_URL) console.error('   -> Missing: SUPABASE_URL');
    if (!process.env.SUPABASE_KEY) console.error('   -> Missing: SUPABASE_KEY');
}
console.log('------------------------------------');

const sessionStore = new Map();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Clean up stale sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionStore.entries()) {
        if (now - session.timestamp > 10 * 60 * 1000) {
            sessionStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

// Root route — required for Railway health check
app.get('/', (req, res) => {
    res.json({ status: 'RGPV Hub API is running', timestamp: new Date().toISOString() });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: "API is working ✅" });
});

// PDF Proxy — Hides Supabase URL from users
app.get('/api/pdf', async (req, res) => {
    const { path: filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: 'Path required' });
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    try {
        // Download file from Supabase Storage
        const { data, error } = await supabase.storage.from('study-materials').download(filePath);
        
        if (error) {
            console.error('Supabase download error:', error.message);
            return res.status(404).json({ error: 'File not found' });
        }

        // Stream PDF to browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        
        const buffer = Buffer.from(await data.arrayBuffer());
        res.send(buffer);
    } catch (err) {
        console.error('PDF Proxy general error:', err.message);
        res.status(500).json({ error: 'Proxy failed to fetch file' });
    }
});

app.post('/api/result', async (req, res) => {
    const { enroll, sem, captcha, sessionId } = req.body;
    const url = 'https://www.rgpvdiploma.in/exam/DiplomaIIIYrResult.aspx';

    try {
        let jar, client, getResponse, $;
        let currentSessionId = sessionId;

        if (currentSessionId && sessionStore.has(currentSessionId)) {
            const session = sessionStore.get(currentSessionId);
            jar = session.jar;
            client = session.client;
            getResponse = session.getResponse;
            $ = cheerio.load(getResponse.data);
        } else {
            jar = new CookieJar();
            client = wrapper(axios.create({ jar, withCredentials: true }));
            currentSessionId = uuidv4();
            getResponse = await client.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
            });
            $ = cheerio.load(getResponse.data);
            sessionStore.set(currentSessionId, { jar, client, getResponse, timestamp: Date.now() });
        }

        const viewState = $('#__VIEWSTATE').val();
        const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
        const eventValidation = $('#__EVENTVALIDATION').val();

        if (!captcha) {
            const captchaImageUrl = $('img[src*="CaptchaImage.axd"]').attr('src');
            if (captchaImageUrl) {
                const imgRes = await client.get(`https://www.rgpvdiploma.in/exam/${captchaImageUrl}`, { responseType: 'arraybuffer' });
                return res.json({
                    success: false,
                    type: 'captcha_required',
                    captchaImg: `data:image/png;base64,${Buffer.from(imgRes.data).toString('base64')}`,
                    sessionId: currentSessionId
                });
            }
        }

        const formData = new URLSearchParams();
        formData.append('__EVENTTARGET', '');
        formData.append('__EVENTARGUMENT', '');
        formData.append('__VIEWSTATE', viewState);
        formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
        formData.append('__EVENTVALIDATION', eventValidation);
        formData.append('ctl00$ContentPlaceHolder1$txtrollno', enroll);
        formData.append('ctl00$ContentPlaceHolder1$drpSemester', sem);
        formData.append('ctl00$ContentPlaceHolder1$btnviewresult', 'View Result');
        formData.append('ctl00$ContentPlaceHolder1$TextBox1', captcha || '');

        const postResponse = await client.post(url, formData.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': url
            }
        });

        const $res = cheerio.load(postResponse.data);
        if (postResponse.data.toLowerCase().includes('wrong text')) {
            sessionStore.delete(currentSessionId);
            return res.json({ success: false, type: 'captcha' });
        }

        let subjects = [];
        let studentInfo = { name: '', enroll: '', branch: '', status: '' };
        let summary = { sgpa: '', cgpa: '', resultDes: '', revalDate: '', division: '' };

        $res('table').each((i, table) => {
            if ($res(table).text().includes('Name') && $res(table).text().includes('Roll No')) {
                $res(table).find('tr').each((j, row) => {
                    const rText = $res(row).text();
                    if (rText.includes('Name')) studentInfo.name = $res(row).find('td').last().text().trim();
                    if (rText.includes('Roll No')) studentInfo.enroll = $res(row).find('td').last().text().trim();
                    if (rText.includes('Branch')) studentInfo.branch = $res(row).find('td').last().text().trim();
                    if (rText.includes('Status')) studentInfo.status = $res(row).find('td').last().text().trim();
                });
            }
        });

        $res('table').each((i, table) => {
            if ($res(table).text().includes('Paper') && $res(table).text().includes('Total Credit')) {
                $res(table).find('tr').each((j, row) => {
                    const cols = $res(row).find('td');
                    if (cols.length >= 4) {
                        const code = $res(cols[0]).text().trim();
                        const tCredit = $res(cols[1]).text().trim();
                        const eCredit = $res(cols[2]).text().trim();
                        const grade = $res(cols[3]).text().trim();

                        const isSubjectRow = code && grade &&
                            !code.toLowerCase().includes('paper') &&
                            !code.toLowerCase().includes('roll') &&
                            !code.toLowerCase().includes('enroll') &&
                            !code.toLowerCase().includes('semester') &&
                            !code.toLowerCase().includes('subject') &&
                            code.length < 15;

                        if (isSubjectRow) {
                            // De-duplicate: Ensure we only show one entry per subject code
                            if (!subjects.some(s => s.code === code)) {
                                subjects.push({ code, tCredit, eCredit, grade });
                            }
                        }
                    }
                });
            }
        });

        $res('table').each((i, table) => {
            const rows = $res(table).find('tr');
            rows.each((j, row) => {
                const rText = $res(row).text().toUpperCase();
                const cols = $res(row).find('td');

                if (rText.includes('SGPA') && rText.includes('CGPA')) {
                    // This is likely the header or the data row itself
                    // Check if this row has numbers
                    const v1 = $res(cols[1]).text().trim();
                    const v2 = $res(cols[2]).text().trim();

                    if (!isNaN(parseFloat(v1)) && v1 !== '0') {
                        summary.sgpa = v1;
                        summary.cgpa = v2;
                    } else {
                        const nextRow = rows.eq(j + 1);
                        if (nextRow.length) {
                            const nCols = nextRow.find('td');
                            const nv1 = $res(nCols[1]).text().trim();
                            const nv2 = $res(nCols[2]).text().trim();
                            if (!isNaN(parseFloat(nv1))) {
                                summary.sgpa = nv1;
                                summary.cgpa = nv2;
                            }
                        }
                    }
                }
                
                if (rText.includes('PASS') || rText.includes('FAIL')) {
                    summary.resultDes = $res(cols[0]).text().trim();
                }
                
                if (rText.includes('DIVISION') || rText.includes('REVALUATION DATE')) {
                    const divText = $res(cols[cols.length - 1]).text().trim();
                    if (divText && !divText.toUpperCase().includes('DIVISION')) {
                        summary.division = divText;
                    }
                }
            });
        });

        // Final fallback for SGPA/CGPA if still empty (aggressive regex search)
        if (!summary.sgpa || summary.sgpa === 'SGPA') {
            // Match things like "SGPA : 7.88" or "SGPA 7.88" or within a table cell
            const sgpaMatch = postResponse.data.match(/SGPA[:\s\t]+([0-9\.]+)/i);
            if (sgpaMatch && sgpaMatch[1] !== '0') summary.sgpa = sgpaMatch[1];
        }
        if (!summary.cgpa || summary.cgpa === 'CGPA') {
            const cgpaMatch = postResponse.data.match(/CGPA[:\s\t]+([0-9\.]+)/i);
            if (cgpaMatch && cgpaMatch[1] !== '0') summary.cgpa = cgpaMatch[1];
        }

        // Even more aggressive: search for any cell containing SGPA then get sibling text
        if (!summary.sgpa) {
            $res('td, span, div').each((i, el) => {
                const text = $res(el).text().trim();
                if (text === 'SGPA' || text.includes('SGPA:')) {
                    const val = $res(el).next().text().trim() || $res(el).parent().find('td').eq(1).text().trim();
                    if (!isNaN(parseFloat(val)) && val !== '0') summary.sgpa = val;
                }
            });
        }

        if (subjects.length === 0) {
            sessionStore.delete(currentSessionId);
            return res.json({ success: false, type: 'not_found' });
        }

        const resultData = { ...studentInfo, semester: sem, subjects, summary, timestamp: new Date().toISOString() };
        sessionStore.delete(currentSessionId);

        if (supabase) {
            try {
                await supabase.from('results_cache').upsert({
                    enrollment: enroll,
                    result_data: resultData,
                    updated_at: new Date()
                });
            } catch (e) {
                // Non-critical — don't fail the request if cache fails
                console.warn('Cache write failed:', e.message);
            }
        }

        res.json({ success: true, data: resultData });

    } catch (error) {
        console.error('Result fetch error:', error.message);
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ 
            success: false, 
            type: 'server_error', 
            message: isProduction ? 'Internal server error' : error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://0.0.0.0:${PORT}`);
});
