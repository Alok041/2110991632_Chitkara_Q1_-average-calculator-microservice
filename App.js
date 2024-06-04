const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const windowSize = 10;
let numbersWindow = [];

// Middleware to limit response time to 500ms
app.use((req, res, next) => {
    res.setTimeout(500, () => {
        res.status(500).send('Request timed out');
    });
    next();
});

// Endpoint to handle requests for numbers
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    // Define mapping for number IDs to their corresponding test server endpoints
    const endpointMap = {
        'p': 'primes',
        'f': 'fibonacci',
        'e': 'even',
        'r': 'random'
    };

    const testServerEndpoint = endpointMap[numberid];
    
    if (!testServerEndpoint) {
        return res.status(400).json({ error: 'Invalid number ID' });
    }

    try {
        const response = await axios.get(`http://20.244.56.144/test/${testServerEndpoint}`);
        const receivedNumbers = response.data.numbers;

        // Filter out duplicates and add new numbers to the window
        receivedNumbers.forEach(num => {
            if (!numbersWindow.includes(num)) {
                if (numbersWindow.length === windowSize) {
                    numbersWindow.shift(); // Remove oldest number if window is full
                }
                numbersWindow.push(num);
            }
        });

        const windowPrevState = [...numbersWindow]; // Copy current window state before modification
        const avg = calculateAverage(numbersWindow);

        const responseObj = {
            numbers: receivedNumbers,
            windowPrevState,
            windowCurrState: numbersWindow,
            avg: avg.toFixed(2) // Format average to two decimal places
        };

        res.json(responseObj);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Function to calculate average of numbers
function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
