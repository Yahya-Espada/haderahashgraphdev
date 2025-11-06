const{
    Client,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    Hbar,
    TransferTransaction
} = require("@hashgraph/sdk");

require("dotenv").config();

async function environmentSetup(){
    // Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (!myAccountId || !myPrivateKey) {
        throw new Error(
            "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
        );
    }
    // Create your Hedera testnet client
    const client = Client.forTestnet();
    // Set your account as the client's operator
    client.setOperator(myAccountId, myPrivateKey);

    //Set the default max transaction fee (in Hbars)
    client.setDefaultMaxTransactionFee(new Hbar(100));

    //Set the default max query payment (in Hbars)
    client.setDefaultMaxQueryPayment(new Hbar(50));

    //Create new account
    const newAccountPrivateKey = await PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("New account ID: " + newAccountId);

    //verify the account balance
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log("The new account balance is: " + accountBalance.hbars.toTinybars());

    //create a transfer transaction
    const sendHbar = await new TransferTransaction()
        .addHbarTransfer(myAccountId, Hbar.fromTinybars(-1000)) //subtract from sender
        .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000)) //add to receiver
        .execute(client);

    //verify the transaction reached consensus
    const transactionReceipt = await sendHbar.getReceipt(client);
    console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());
    
}
environmentSetup();