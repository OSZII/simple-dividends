const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: {
        'User-Agent': 'simple-dividends.com in development (office@ostojicstefan.com)', // THIS IS YOUR "KEY"
        'Accept-Encoding': 'gzip, deflate',
    }
});
const data = await response.json();

console.log(Object.keys(data));

export { };