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

export const sendEmail = ({
    from,
    to,
    subject,
    text,
}: {
    from?: string;
    to: string | [string];
    subject: string;
    text?: string;
}) => {
    return transporter.sendMail({
        from: from || defaultFrom,
        to,
        subject,
        text: text || '',
    });
};
