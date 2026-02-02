const pdf = require('pdf-parse');
const fs = require('fs');

console.log('Type of pdf:', typeof pdf);
console.log('Value of pdf:', pdf);

// Create a dummy PDF buffer (not a real PDF, will fail parsing but check function call)
try {
    const buffer = Buffer.from('Dummy Data');
    pdf(buffer).then(data => {
        console.log('Success:', data.text);
    }).catch(err => {
        console.log('Expected error (not a real PDF):', err.message);
    });
} catch (e) {
    console.log('Synchronous error:', e);
}
