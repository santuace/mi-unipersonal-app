import nodemailer from 'nodemailer';

export interface MailConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    to: string;
}

export async function sendEmail(
    htmlContent: string,
    subject: string,
    config: MailConfig
): Promise<boolean> {

    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465, // true for 465, false for other ports
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        const info = await transporter.sendMail({
            from: config.from, // '"Uruimporta AI" <foo@example.com>'
            to: config.to,
            subject: subject,
            html: htmlContent,
        });

        console.log("✅ Email enviado: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("❌ Error enviando email:", error);
        return false;
    }
}
