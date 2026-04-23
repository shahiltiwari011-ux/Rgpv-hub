import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

// Updated CORS to be more permissive for local development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}

const sessionStore = new Map();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Health check for frontend
app.get('/api/health', (req, res) => res.json({ status: 'online' }));

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
                        
                        // Strict filtering for academic subjects
                        const isSubjectRow = code && grade && 
                                           !code.toLowerCase().includes('paper') && 
                                           !code.toLowerCase().includes('roll') &&
                                           !code.toLowerCase().includes('enroll') &&
                                           !code.toLowerCase().includes('semester') &&
                                           code.length < 15; // Subject codes are usually short

                        if (isSubjectRow) {
                            subjects.push({ code, tCredit, eCredit, grade });
                        }
                    }
                });
            }
        });

        $res('table').each((i, table) => {
            const text = $res(table).text();
            if (text.includes('SGPA') && text.includes('Result Des')) {
                $res(table).find('tr').each((j, row) => {
                    const cols = $res(row).find('td');
                    const rText = $res(row).text();
                    if (rText.includes('SGPA')) {
                        summary.sgpa = $res(cols[1]).text().trim();
                        summary.cgpa = $res(cols[2]).text().trim();
                    }
                    if (rText.includes('PASS') || rText.includes('FAIL')) {
                        summary.resultDes = $res(cols[0]).text().trim();
                    }
                    if (rText.includes('Revaluation Date')) {
                        summary.division = $res(cols[2]).text().trim();
                    }
                    if (rText.match(/\d{2}\/\d{2}\/\d{4}/)) {
                        summary.revalDate = $res(cols[0]).text().trim();
                    }
                });
            }
        });

        if (subjects.length === 0) {
            sessionStore.delete(currentSessionId);
            return res.json({ success: false, type: 'not_found' });
        }

        const resultData = { ...studentInfo, semester: sem, subjects, summary, timestamp: new Date().toISOString() };
        sessionStore.delete(currentSessionId);
        
        if (supabase) {
            try { await supabase.from('results_cache').upsert({ enrollment: enroll, result_data: resultData, updated_at: new Date() }); } catch (e) {}
        }
        res.json({ success: true, data: resultData });

    } catch (error) {
        res.status(500).json({ success: false, type: 'server_error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://0.0.0.0:${PORT}`);
});
