const pdf = require('pdf-parse');

console.log('Keys:', Object.keys(pdf));
console.log('Has default?', 'default' in pdf);
console.log('Type of default:', typeof pdf.default);

if (typeof pdf.default === 'function') {
    console.log('Calling pdf.default...');
    try {
        pdf.default(Buffer.from('test')).catch(e => console.log('Catch:', e.message));
    } catch (e) { console.log(e); }
} else {
    // Maybe the function is the module itself but something confused it?
    // Unlikely if typeof is object.
}
