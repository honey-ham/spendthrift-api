import nodemailer from 'nodemailer';

import { getEnv } from '../utils/misc.js';

const defaultFrom = `${getEnv('EMAIL_DISPLAY_NAME')} <${getEnv('EMAIL_USERNAME')}>`;
const transporter = nodemailer.createTransport({
    host: getEnv('EMAIL_HOST'),
    port: 465,
    secure: true,
    auth: {
        user: getEnv('EMAIL_USERNAME'),
        pass: getEnv('EMAIL_PASSWORD'),
    },
});

const sendEmail = ({
    from,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
}: {
    from?: string;
    to: string | [string];
    cc?: string | [string];
    bcc?: string | [string];
    subject: string;
    text?: string;
    html?: string;
}) => {
    try {
        return transporter.sendMail({
            from: from || defaultFrom,
            to,
            cc,
            bcc,
            subject,
            text: text || '',
            html,
        });
    } catch (e) {
        console.error(e);
        return null;
    }
};

const sendVerificationEmail = ({
    to,
    firstName,
    userId,
}: {
    to: string;
    firstName: string;
    userId: string;
}) => {
    const host = 'http://localhost:3000';
    return sendEmail({
        to,
        subject: 'Verify Your Email',
        text: `Hey ${firstName},\n\nClick this link to verify your email: ${host}/verifyEmail/${userId}\n\nThanks,\n\nSpendthrift Admin`,
    });
};

export { sendEmail, sendVerificationEmail };
