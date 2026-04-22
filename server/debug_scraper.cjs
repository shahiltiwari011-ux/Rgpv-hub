const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const cheerio = require('cheerio');
const fs = require('fs');

async function testScraper() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));
    const url = 'https://result.rgpv.ac.in/result/Diplomarslt.aspx';
    const enrollment = '24047C04054';
    const semester = '3';

    try {
        console.log('Fetching initial page...');
        const getResponse = await client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(getResponse.data);
        const viewState = $('#__VIEWSTATE').val();
        const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
        const eventValidation = $('#__EVENTVALIDATION').val();
        const hasCaptcha = $('#ctl00_ContentPlaceHolder1_pnlCaptcha').length > 0;

        console.log(`Initial page loaded. Captcha panel: ${hasCaptcha}`);

        const formData = new URLSearchParams();
        formData.append('__EVENTTARGET', '');
        formData.append('__EVENTARGUMENT', '');
        formData.append('__VIEWSTATE', viewState);
        formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
        formData.append('__EVENTVALIDATION', eventValidation);
        formData.append('ctl00$ContentPlaceHolder1$txtrollno', enrollment);
        formData.append('ctl00$ContentPlaceHolder1$drpSemester', semester);
        formData.append('ctl00$ContentPlaceHolder1$btnviewresult', 'View Result');
        formData.append('ctl00$ContentPlaceHolder1$TextBox1', ''); // Empty captcha

        console.log('Posting form...');
        const postResponse = await client.post(url, formData.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': url,
                'Origin': 'https://result.rgpv.ac.in'
            }
        });

        fs.writeFileSync('test_response.html', postResponse.data);
        console.log('Response saved to test_response.html');

        if (postResponse.data.includes('Enter Captcha')) {
            console.log('FAILED: Captcha required');
        } else if (postResponse.data.includes('Result not found')) {
            console.log('FAILED: Result not found');
        } else {
            console.log('SUCCESS? Checking for table...');
            const $res = cheerio.load(postResponse.data);
            const table = $res('#ctl00_ContentPlaceHolder1_dgResult');
            console.log(`Table found: ${table.length > 0}`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testScraper();
