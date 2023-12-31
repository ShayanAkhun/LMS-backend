require("dotenv").config();
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const { email, subject, template, data } = options;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Get the email template path
    const templatePath = path.join(__dirname, "../mails", template);

    // Render the email template with EJS
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject,
      html, // Not template
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully to:', email);
  } catch (error) {
    console.error('Error:', error);
  }
};

export default sendMail;
