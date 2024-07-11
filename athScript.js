import * as fs from 'fs';

export default async function fetchAllTimeHighs(jupList) {
    let existingResults = {};
    try {
        existingResults = JSON.parse(fs.readFileSync('ath_data.json', 'utf8'));
    } catch (e) {
        console.log('No existing data or error reading file:', e);
    }

    const results = { ...existingResults };

    for (const token of jupList) {
        console.log(token)
        if (results[token.address]) {
            console.log(`Skipping ${token.address} as it is already fetched.`);
        }
        else{
            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/coins/${token.extensions.coingeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);            
                if (response.status === 429) { // Rate limit hit
                    console.log('Rate limit hit, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute
                    continue; // Retry the current token
                }
                const data = await response.json();
                console.log(data)
                const ath = data.market_data.ath.usd;
                results[token.address] = { address: token.address, name: token.name, symbol:token.symbol, ath: ath, coinGeckoId: token.extensions.coingeckoId, lastUpdatedAt: data.last_updated };
                fs.writeFileSync('ath_data.json', JSON.stringify(results, null, 2));
            } catch (e) {
                console.error(`Failed to fetch data for ${token.address}: ${e}`);
            }
        }
    }
}

// Example call to the function with jupList JSON
const response = await fetch("https://token.jup.ag/strict");
const jupList = await response.json();

fetchAllTimeHighs(jupList);

