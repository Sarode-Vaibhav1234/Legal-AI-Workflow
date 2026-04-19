const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const pdfParse = require('pdf-parse');

const pipeline = util.promisify(require('stream').pipeline);

// Generate exactly 32 bytes key from the env variable
const getEncryptionKey = () => {
  const secret = process.env.DOCUMENT_ENCRYPTION_KEY || 'default_secret_key_fallback_123';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
};

// Encrypt and Compress
const secureAndStoreFile = async (inputFileBuffer, originalFileName) => {
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);

  const compressedData = zlib.gzipSync(inputFileBuffer);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encryptedData = cipher.update(compressedData);
  encryptedData = Buffer.concat([encryptedData, cipher.final()]);

  const safeFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.enc`;
  const encryptedPath = path.join(__dirname, '..', 'uploads', safeFileName);

  fs.writeFileSync(encryptedPath, encryptedData);

  return {
    encryptedPath,
    iv: iv.toString('hex')
  };
};

// Decrypt and Decompress
const retrieveAndDecryptFile = async (encryptedPath, ivHex) => {
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');

  const encryptedData = fs.readFileSync(encryptedPath);

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decryptedCompressedData = decipher.update(encryptedData);
  decryptedCompressedData = Buffer.concat([decryptedCompressedData, decipher.final()]);

  const originalData = zlib.gunzipSync(decryptedCompressedData);

  return originalData; // Buffer
};

// Extract Text
const extractText = async (fileBuffer, mimeType) => {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else if (mimeType.startsWith('text/')) {
      return fileBuffer.toString('utf-8');
    }
    return ''; // Return empty if not supported text format
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
};

module.exports = {
  secureAndStoreFile,
  retrieveAndDecryptFile,
  extractText
};
