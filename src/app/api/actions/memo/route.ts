import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, MEMO_PROGRAM_ID, createPostResponse, parseURL } from "@solana/actions"
import { ComputeBudgetProgram, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import getAllTokens from "../../../utils/getAllTokens";
import getPriceDiff from "../../../utils/getPriceDiff";
require('dotenv').config();

export const GET = (req: Request) => {
    const payload: ActionGetResponse = {
        icon: new URL("/cleanit.jpg", new URL(req.url).origin).toString(),
        label: "Click for Surprise",
        description: "Surprise",
        title: "Experimenting"
    }

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS
    })
}

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try{
        const body: ActionPostRequest = await req.json();

        let account: PublicKey;

        const rpcUrl = process.env.RPC_URL;

        if (!rpcUrl) {
            return new Response('RPC_URL is not defined in environment variables', {
                status: 500,
                headers: ACTIONS_CORS_HEADERS
            });
        }

        try{
            account = new PublicKey(body.account);
        } catch (err) {
            return new Response('invalid account provided', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS
            })
        }

        console.log(`${account}`);

        const connection = new Connection(rpcUrl);

        //Get user tokens present in the JUP strict List
        
        const allTokens = await getAllTokens(account, connection);
        
        // console.log(allTokens);

        //Get the price difference of all user tokens
        const priceDiff = await getPriceDiff(allTokens);

        // console.log(priceDiff);

        const transaction = new Transaction();

        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000
            }),
            new TransactionInstruction({
                programId: new PublicKey(MEMO_PROGRAM_ID),
                data: Buffer.from("Experimenting", "utf8"),
                keys: [],
            })
        )

        transaction.feePayer = account;

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction,
                message: `Got Rekt for $${priceDiff}`
            }
        })

        return Response.json(payload, { headers: ACTIONS_CORS_HEADERS})
    } catch(err){
        return Response.json("unkown error", { status: 400})
    }
}