// services/whatsapp.js
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const AUTH_FOLDER = './auth_info_baileys';

let sock;

export async function initializeWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📲 Scan this QR to login to WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed. Reconnect?', shouldReconnect);
      if (shouldReconnect) initializeWhatsApp();
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

export default async function sendWhatsAppMessage(to, message) {
  if (!sock || !sock.user) {
    console.error('❌ WhatsApp is not connected. Cannot send message.');
    return;
  }

  const whatsappId = `${to}@s.whatsapp.net`;

  try {
    console.log(to);
    const result = await sock.sendMessage(whatsappId, { text: message });
    console.log(`📩 Message sent to ${to}`, result.key.id);
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp message to ${to}`, err.message);
  }
}
