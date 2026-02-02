const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testScreening() {
    try {
        const form = new FormData();
        form.append('department', 'Roads');
        form.append('designation', 'Officer');
        // Create a dummy file
        fs.writeFileSync('dummy.txt', 'This is a test document for Roads Department official appointment.');
        form.append('file', fs.createReadStream('dummy.txt'));

        const response = await axios.post('http://localhost:8000/screen-officer', form, {
            headers: form.getHeaders()
        });

        console.log('Success:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

testScreening();
