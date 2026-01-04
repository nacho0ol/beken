
const CryptoJS = require("crypto-js");
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;

// dipake pas Register/Tambah User
const encryptPassword = (text) => {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
};

// dipake pas Login/Verifikasi User
const decryptPassword = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = { encryptPassword, decryptPassword };