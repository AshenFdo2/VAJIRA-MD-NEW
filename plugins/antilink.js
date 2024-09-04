// antilink.js
module.exports = {
    name: 'antilink',
    description: 'Deletes unauthorized links from group messages and restricts links to admins only',
    execute: async (sock, message, groupId, adminOnly, forbiddenLinksPattern) => {
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const senderId = sender.split('@')[0];

        // Check if the message contains any forbidden links
        if (chatId === groupId && forbiddenLinksPattern.test(message.message.conversation)) {
            try {
                // Fetch group metadata to identify admins
                const groupMetadata = await sock.groupMetadata(chatId);
                const groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(admin => admin.id);

                // Check if the sender is an admin
                const isAdmin = groupAdmins.includes(sender);

                // If only admins can send links and the sender is not an admin, delete the message
                if (adminOnly && !isAdmin) {
                    await sock.sendMessage(chatId, {
                        delete: {
                            id: message.key.id,
                            remoteJid: chatId,
                            fromMe: false,
                        },
                    });

                    // Notify the group about the deleted message
                    const warnMessage = `🚫 Links are not allowed unless you're an admin. The message from ${senderId} has been removed.`;
                    await sock.sendMessage(chatId, { text: warnMessage });
                }
            } catch (error) {
                console.error('Error handling link deletion:', error);
            }
        }
    }
};
