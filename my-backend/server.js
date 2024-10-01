const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Configure the Nodemailer transport service
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your preferred email service provider
  auth: {
    user: 'your-email@gmail.com', // Your Gmail
    pass: 'your-email-password', // App Password for Gmail or normal password
  },
});

// Route to send emails
app.post('/send-email', (req, res) => {
  const { email, role, documentId } = req.body;

  // Email content
  const mailOptions = {
    from: 'your-email@gmail.com', // Sender email
    to: email, // Recipient's email
    subject: `Document ${role === 'editor' ? 'Editing' : 'Viewing'} Invitation`,
    text: `You have been granted ${role} access to the document. Click here to ${role}: http://localhost:3000/documents/${documentId}?role=${role}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to send email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Email sent successfully' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
