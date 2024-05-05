import nodemailer from "nodemailer";

import { getEnv } from "../utils/misc.js";

const transporter = nodemailer.createTransport({
  host: getEnv("EMAIL_HOST"),
  port: 465,
  secure: true,
  auth: {
    user: getEnv("EMAIL_USERNAME"),
    pass: getEnv("EMAIL_PASSWORD"),
  },
});

export const sendEmail = () => {
  return transporter.sendMail({
    from: '"Spendthrift Admin" <admin@saha.nexus>',
    to: "sgharr304@gmail.com", // list of receivers
    subject: "TEST", // Subject line
    text: "Hello world?", // plain text body
  });
};
