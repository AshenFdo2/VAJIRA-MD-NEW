const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// Import plugins
const welcomePlugin = require('./plugins/welcome');
const antiLinkPlugin = require('./plugins/antilink');

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
        // Execute the welcome plugin
        await welcomePlugin.execute(sock, groupId, groupName, message);
    });

    // Handle messages
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        if (!message.message) return;

        // Execute the anti-link plugin
        await antiLinkPlugin.execute(sock, message, groupId, adminOnly, forbiddenLinksPattern);
    });
}

// Start the bot
startBot();
