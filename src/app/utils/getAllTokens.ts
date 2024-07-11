import { Connection, PublicKey } from "@solana/web3.js";

// Cache for JUP strict token list to reduce network requests
let cachedStrictTokenList: { address: string, coinGeckoId?: string }[] | null = null;

export interface Token {
    address: string;
    uiAmount: string;
    coinGeckoId?: string;
    extensions?: { coingeckoId?: string };
}

async function fetchStrictTokenList(): Promise<any[]> {
  if (cachedStrictTokenList) {
    return cachedStrictTokenList;
  }
  const response = await fetch("https://token.jup.ag/strict");
  const strictTokenList: Token[] = await response.json();
  cachedStrictTokenList = strictTokenList.map(token => ({
    address: token.address,
    coinGeckoId: token.extensions?.coingeckoId
  }));
  return cachedStrictTokenList;
}

export default async function getAllTokens(wallet: PublicKey, connection: Connection) {
  const strictTokenAddresses = await fetchStrictTokenList();

  try {
    const userTokens = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    const strictUserTokens = userTokens.value.filter(token => 
      strictTokenAddresses.some(strictToken => strictToken.address === token.account.data.parsed.info.mint)
    );

    return strictUserTokens.map(token => {
      const matchingToken = strictTokenAddresses.find(strictToken => strictToken.address === token.account.data.parsed.info.mint);
      if (matchingToken) {
        return {
          address: token.account.data.parsed.info.mint,
          uiAmount: token.account.data.parsed.info.tokenAmount.uiAmountString,
          coinGeckoId: matchingToken.coinGeckoId
        };
      } else {
        return {
          address: token.account.data.parsed.info.mint,
          uiAmount: token.account.data.parsed.info.tokenAmount.uiAmountString,
          coinGeckoId: undefined
        };
      }
    });
  } catch (err) {
    console.error('Error fetching user tokens:', err);
    return [];
  }
}