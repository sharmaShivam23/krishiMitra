const algosdk = require('algosdk');
const account = algosdk.generateAccount();
console.log("My Address: ", account.addr.toString()); 
console.log("My Secret Words (Mnemonic): ", algosdk.secretKeyToMnemonic(account.sk));