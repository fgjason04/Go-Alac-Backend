const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for CORS and serving static files
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// Set up Multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// API endpoint for submitting the report
app.post('/submit-report', upload.array('mediaUpload'), async (req, res) => {
    try {
        console.log('Received body:', req.body); // Check the body
        console.log('Received files:', req.files); // Check the files

        const { incidentType, description } = req.body;
        const files = req.files;

        if (!incidentType || !description) {
            // Clean up uploaded files if something is missing
            if (files) {
                files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ error: 'Missing incident type or description.' });
        }

        // Create a Nodemailer transporter using credentials from environment variables
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email address from an environment variable
                pass: process.env.EMAIL_PASS // Your App Password from an environment variable
            }
        });

        // Prepare attachments
        const attachments = files ? files.map(file => ({
            filename: file.originalname,
            path: file.path,
        })) : [];

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: 'teampadanom@gmail.com', // Recipient address
            subject: `New Incident Report: ${incidentType}`,
            html: `
                <h1>New Incident Report</h1>
                <p><strong>Incident Type:</strong> ${incidentType}</p>
                <p><strong>Description:</strong></p>
                <p>${description}</p>
                <p>Photos and videos are attached.</p>
            `,
            attachments: attachments
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Clean up uploaded files after sending the email
        if (files) {
            files.forEach(file => fs.unlinkSync(file.path));
        }

        res.status(200).json({ message: 'Report submitted and email sent successfully!' });

    } catch (error) {
        console.error('Error handling report:', error);
        // Clean up files in case of an error
        if (req.files) {
            req.files.forEach(file => fs.unlinkSync(file.path));
        }
        res.status(500).json({ error: 'Failed to submit report. Please try again later.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
