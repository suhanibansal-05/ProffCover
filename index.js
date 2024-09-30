const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); 

async function fetchLlamaInsights(userQuery) {
    const prompt = `The user asks: ${userQuery}. Please analyze and provide a response.`;

    try {
        const response = await axios.post('https://phi.us.gaianet.network/v1/chat/completions', {
            model: 'phi',
            messages: [
                { role: 'system', content: 'In order to submit applications for jobs, I want to write a new cover letter. Please compose a cover letter describing my technical skills and leave the HR a positive impression.' },
                { role: 'user', content: prompt }
            ]
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching Llama Insights', error);
        return 'An error occurred while fetching insights.';
    }
}

app.post('/api/chat', async (req, res) => {
    const userQuery = req.body.query; 
    const insights = await fetchLlamaInsights(userQuery); 
    res.json({ reply: insights });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});