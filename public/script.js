document.getElementById('send-button').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    // Display user's input in the chatbox
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<p><strong>User:</strong> ${userInput}</p>`;

    // Send the query to the server
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: userInput }),
        });

        const data = await response.json();

        // Display the AI's response
        chatBox.innerHTML += `<p><strong>AI:</strong> ${data.reply}</p>`;
    } catch (error) {
        console.error('Error:', error);
        chatBox.innerHTML += '<p><strong>Error:</strong> Unable to fetch the response.</p>';
    }

    // Clear the input field
    document.getElementById('user-input').value = '';
});