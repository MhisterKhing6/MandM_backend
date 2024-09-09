/**Email Communication */
import configuration from "config";
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';

// initialize nodemailer
let transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth:{
            user: configuration.email.email,
            pass: configuration.email.secrete
        }
    }
);

// point to the template folder
const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

// use a template file with nodemailer
transporter.use('compile', hbs(handlebarOptions))
// const send email

const sendEmailVerification  = async (user, verificationCode) => {
    /**
     * sendEmailVerification : sends email to user with verification code
     * @param {object} user: object containing user name and email
     * @param {string} verificationCode: secret test to send
     * @return {object | null} if message is sent successfully
     */
  const mailOptions = {
    from: `"M and M" <${configuration.email.email}>`, // sender address
    template: "email", // the name of the template file, i.e., email.handlebars
    to: user.email,
    subject: `Password to login, ${user.name}`,
    context: {
      name: user.name,
      password:verificationCode
    },
  };
  try {
    return await transporter.sendMail(mailOptions)
  } catch(err) {
    console.log(`${err} \n sending email ${user.name} ${user.email}`)
    return null
  }
}

const sendResetPassword  = async (user, secreteText) => {
  /**
    * sendEmailVerification : sends email to user with secrete text
    * @param {object} user: object containing user name and email
    * @param {string} secreteText: secret test to send
    * @return {object | null} if message is sent successfully
    */
 const mailOptions = {
   from: `"Reset" <${configuration.email.email}>`, // sender address
   template: "password", // the name of the template file, i.e., email.handlebars
   to: user.email,
   subject: `Reset you Password, ${user.name}`,
   context: {
     name: user.name,
     secreteText
   },
 };
 try {
   return  await transporter.sendMail(mailOptions)
 } catch(err) {
   console.log(`${err} \n sending email ${user.name} ${user.email}`)
 }
}


const sendStatusInformation  = async (user, orderId, status, day) => {
  /**
   * send status update : sends email to user with verificaiton code
   * @param {object} user: object containing user name and email
   * @param {string} orderId: secret test to send
   * @return {object | null} if message is sent successfully
   */
const mailOptions = {
  from: `"HallMark Caffee" <${configuration.email.email}>`, // sender address
  template: "updateStatus", // the name of the template file, i.e., email.handlebars
  to: user.email,
  subject: `Order Status, ${user.name}`,
  context: {
    name: user.name,
    orderId:orderId,
    status:status,
    day:day
  },
};
try {
  return await transporter.sendMail(mailOptions)
} catch(err) {
  console.log(`${err} \n sending email ${user.name} ${user.email}`)
  return null
}
}



export { sendEmailVerification, sendResetPassword, sendStatusInformation };

  