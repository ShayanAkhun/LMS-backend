require("dotenv").config();
import nodemailer, {Transporter} from "nodemailer";
import ejs from "ejs";
import path from "path";


interface EMailOptions {
    email: string;
    subject: string;
    template: string;
    data : {[key: string]: any}
}

const sendMail = async (options: EMailOptions):Promise <void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"), //465 for
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const {email, subject, template, data} = options;

        //gets the path to the ejs file and renders it to html
    const templatePath = path.join(__dirname, `../mails/${template}.ejs`);

    //renders the ejs file to html
    const html:string = await ejs.renderFile(templatePath, data);

    //send the mail via SMTP
  const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    };
await transporter.sendMail(mailOptions);
}
export default sendMail;
