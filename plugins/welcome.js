// welcome.js
module.exports = {
    name: 'welcome',
    description: 'Sends a welcome message when a new member joins the group',
    execute: async (sock, groupId, groupName, message) => {
        // Send welcome message when a new member joins
        if (message.action === 'add' && message.id === groupId) {
            message.participants.forEach(participant => {
                const welcomeMessage = `👋 Welcome to ${groupName}! 🎉 This is an airdrop group where you can earn money and get free tips. Don't forget to add your friends to help the community grow!`;
                sock.sendMessage(groupId, { text: welcomeMessage });
            });
        }

        // Send thank-you message if someone adds new members
        if (message.action === 'add' && message.id === groupId) {
            message.participants.forEach(() => {
                const thankMessage = `🙏 Thank you for adding new members! Let's grow our community together.`;
                sock.sendMessage(groupId, { text: thankMessage });
            });
        }
    }
};
