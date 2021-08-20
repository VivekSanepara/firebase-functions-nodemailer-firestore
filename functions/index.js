/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const config = require("./config/config");
const EmailTemplates = require("swig-email-templates");

admin.initializeApp();
const db = admin.firestore();


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const templates = new EmailTemplates({
  root: "emails/",
  swig: {
    cache: false,
  },
});

const sendMail = (email, subjectName, mailTemplateName, mailData) => {
  return new Promise(async (resolve, reject) => {
    console.log("1");
    templates.render(
      mailTemplateName,
      mailData,
      async (err, html, text, sub) => {
        console.log("2");

        const transporter = await nodemailer.createTransport({
          
          //Write you service, port and host name accordingly
          service: "zoho",
        
          host: "smtp.zoho.com",
          port: 587,
          startssl: {
            enable: true,
          },
          secureConnection: true,
          auth: {
            user: config.sender.email,
            pass: config.sender.password,
          },
        });
        console.log("3");

        const mailOptions = {
          from: config.sender.email, // sender address
          to: email, // list of receivers
          subject: subjectName, // Subject line
          html,
        };
        console.log("4");

        let info = await transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error.message);
          }
          
        });
        resolve(info);

      })
  })
}



app.post('/saveUser', async (req, res) => {

  const form = req.body.Form
  const user = {
    "budget": form.budget,
    "customReq": form.customReq,
    "email": form.email,
    "firstName": form.firstName,
    "lastName": form.lastName,
    "number": form.number,
    "requirement": form.requirement,
    "service": form.service,
    "startTime": form.startTime
  }
  try {
    db.collection("userCollection").add(user);

    const p1 = sendMail(user.email, "Thankyou For contacting RejoiceHub", "sample1.html", user)

    const p2 = sendMail("vv@vv.vcom", "New Inquiry", "sample.html", user)


    console.log('saveUsers', user)
    await Promise.all([p1, p2])

    res.status(200).send(user);

  } catch (error) {
    console.log("error", error);
  }
})

const api = functions.https.onRequest(app);
module.exports = { api };

