import { Token } from "./getAllTokens";
import existingResults from '../../../ath_data.json';

// Define a type for the structure of each token's data in results
interface TokenData {
    address: string;
    name: string;
    symbol: string;
    ath?: number; // Make 'ath' optional
    coinGeckoId: string;
    lastUpdatedAt?: string | null; // Allow null as a possible value
}

// Define the type for the results object with an index signature
interface Results {
    [key: string]: TokenData;
}

export default async function getPriceDiff(userTokens: Token[]) {
    let totalAth = 0;
    let totalCurrentPrice = 0;

    // Cast existingResults to the Results type
    const results: Results = { ...existingResults };

    for (const token of userTokens) {
        let price = 0;
        let ath = 0;

        const tokenAddress = token.address;

        try {
            const jupPrice = await fetch(`https://price.jup.ag/v6/price?ids=${tokenAddress}`);
            const jupData = await jupPrice.json();
            // console.log(jupData)
            price = jupData.data[tokenAddress].price,
            ath = results[token.address].ath?? 0
        } catch (e) {
            // console.log(token.coinGeckoId)
            // console.log(e);
            continue; // Skip to the next token if the fetch fails
        }

        // console.log(`Price ${price}`)
        totalAth += ath * parseFloat(token.uiAmount);
        totalCurrentPrice += price * parseFloat(token.uiAmount);
        // console.log(`Total Ath ${totalAth}`)
        // console.log(`Total Current Price ${totalCurrentPrice}`)
    }
    return totalAth - totalCurrentPrice;
}