const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/0d86b1f81dba4e6c999d80d8ae860ec0"));



module.exports = {
    gasLimit: 210000,
    gwei: 9
}