module.exports = async (conn, update) => {
    if (update.action === 'add') {
        const welcomeMessage = 'Welcome to CRYPTOLINK CHAT GROUP!';
        const imagePath = './path_to_your_welcome_image.jpg'; // Update the path accordingly

        await conn.sendMessage(update.id, { image: { url: imagePath }, caption: welcomeMessage });
    }
};
