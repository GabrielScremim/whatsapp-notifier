// Importa as bibliotecas necessárias
const qrcode = require('qrcode-terminal'); // Para gerar o QR Code no terminal
const { Client, LocalAuth } = require('whatsapp-web.js'); // Importa o cliente do WhatsApp
const http = require('http'); // Para fazer requisições HTTP

// Cria uma instância do cliente do WhatsApp, utilizando autenticação local
const client = new Client({
    authStrategy: new LocalAuth() // Usa estratégia de autenticação local
});

// Números dos destinatários no WhatsApp
const recipientNumber = '554399457231'; // Troque pelo seu número de destinatário

// Lista de servidores a serem monitorados
const servers = [
    { url: 'http://10.72.3.130', isDown: false },
    { url: 'http://200.201.27.34', isDown: false } // Adicione mais servidores se necessário
];

// Evento que é acionado quando o QR Code é gerado
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true }); // Gera e exibe o QR Code no terminal
});

// Evento que é acionado quando o cliente está pronto
client.on('ready', () => {
    console.log('Cliente está pronto!'); // Mensagem de confirmação no console
    // Começa a verificar o status dos servidores a cada 1 min
    setInterval(checkServersStatus, 60000);
});

// Função para verificar o status dos servidores
async function checkServersStatus() {
    for (const server of servers) {
        http.get(server.url, (res) => {
            // Se o servidor retornar o status 200 (online)
            if (res.statusCode === 200) {
                console.log(`${server.url} está online`); // Mensagem de status
                if (server.isDown) {
                    // Envia mensagem de alerta quando o servidor voltar a ficar online
                    sendWhatsAppMessage(`Alerta: O servidor ${server.url} está online novamente!`);
                    server.isDown = false; // Reseta a variável quando o servidor está online
                }
            } else {
                // Se o servidor não está online e ainda não enviamos mensagem de alerta
                if (!server.isDown) {
                    console.log(`${server.url} está fora do ar, enviando mensagem...`); // Mensagem de status
                    sendWhatsAppMessage(`Alerta: O servidor ${server.url} está fora do ar!`); // Envia mensagem de alerta
                    server.isDown = true; // Define que o servidor está fora do ar
                }
            }
        }).on('error', (e) => {
            // Se ocorrer um erro ao tentar acessar o servidor
            if (!server.isDown) { // Envia mensagem apenas se o servidor estava online antes
                console.log(`${server.url} está fora do ar, enviando mensagem...`); // Mensagem de status
                sendWhatsAppMessage(`Alerta: O servidor ${server.url} está fora do ar!`); // Envia mensagem de alerta
                server.isDown = true; // Define que o servidor está fora do ar
            }
        });
    }
}

// Função para enviar mensagem no WhatsApp
async function sendWhatsAppMessage(message) {
    try {
        // Tenta enviar a mensagem para o número do destinatário
        await client.sendMessage(`${recipientNumber}@c.us`, message); // Envia a mensagem
        console.log('Mensagem enviada:', message); // Mensagem de confirmação no console
    } catch (error) {
        // Se ocorrer um erro ao enviar a mensagem
        console.error('Falha ao enviar a mensagem:', error); // Exibe o erro no console
    }
}

// Inicializa o cliente do WhatsApp
client.initialize();
