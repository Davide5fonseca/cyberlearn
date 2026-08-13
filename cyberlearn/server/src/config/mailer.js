const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Em testes não há ligação de rede ao Gmail.
if (process.env.NODE_ENV !== 'test') {
    transporter.verify(function (error) {
        if (error) {
            console.error('❌ Erro de ligação ao Email (Verifica o .env):', error.message);
        } else {
            console.log('✅ Servidor de Email pronto para mensagens!');
        }
    });
}

const templateCodigo = (titulo, intro, codigo, rodape) => `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: center;">
        <h2 style="color: #171f2f;">${titulo} 🛡️</h2>
        ${intro}
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${codigo}
        </div>
        <p style="color: #6b7280; font-size: 12px;">${rodape}</p>
    </div>
`;

const enviarCodigo2FA = (utilizador, codigo) => transporter.sendMail({
    from: `"CyberLearn Segurança" <${process.env.EMAIL_USER}>`,
    to: utilizador.email,
    subject: 'CyberLearn - Código de Verificação',
    html: templateCodigo(
        'Código de Segurança',
        `<p style="color: #333; font-size: 16px;">Olá ${utilizador.nome},</p>
         <p style="color: #333; font-size: 16px;">Para entrares na tua conta CyberLearn, insere o seguinte código de 6 dígitos:</p>`,
        codigo,
        'Este código é válido por 10 minutos.'
    )
});

const enviarCodigoRecuperacao = (email, codigo) => transporter.sendMail({
    from: `"CyberLearn Suporte" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'CyberLearn - Código de Recuperação de Senha',
    html: templateCodigo(
        'Recuperação de Palavra-Passe',
        '<p style="color: #333; font-size: 16px;">Para criares uma nova palavra-passe, insere este código na plataforma:</p>',
        codigo,
        'Válido por 15 minutos. Se não pediste isto, ignora o email.'
    )
});

module.exports = { transporter, enviarCodigo2FA, enviarCodigoRecuperacao };
