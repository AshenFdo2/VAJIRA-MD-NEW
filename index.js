const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// Initialize state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const groupId = 'YOUR_GROUP_ID'; // Replace this with your group's ID
const groupName = 'CRYPTOLINK'; // Your group name
const adminOnly = true; // Only admins can send links
const forbiddenLinksPattern = /(http:\/\/|https:\/\/|www\.|\.com|\.net|\.org|\.me|\.lk|\.in|\.ly|facebook\.com|fb\.com|t\.me|telegram\.me|adult|porn|sex)/gi; // Customize forbidden links pattern

// Function to connect the bot
function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Save session data on updates
    sock.ev.on('creds.update', saveState);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    // Handle group participants update
    sock.ev.on('group-participants.update', async (message) => {
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
    });

    // Handle messages
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        if (!message.message) return;

        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const senderId = sender.split('@')[0];

        // Anti-link logic
        if (chatId === groupId && forbiddenLinksPattern.test(message.message.conversation)) {
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(admin => admin.id);
                const isAdmin = groupAdmins.includes(sender);

                if (adminOnly && !isAdmin) {
                    await sock.sendMessage(chatId, { delete: { id: message.key.id, remoteJid: chatId, fromMe: false } });
                    const warnMessage = `🚫 Links are not allowed unless you're an admin. The message from ${senderId} has been removed.`;
                    await sock.sendMessage(chatId, { text: warnMessage });
                }
            } catch (error) {
                console.error('Error handling link deletion:', error);
            }
        }
    });
}

// Start the bot
startBot();
