// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

exports.sendGradeNotification = functions.https.onCall(async (data, context) => {
    // Create email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Email template
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: data.to,
        subject: data.subject,
        html: `
            <h2>Grade Posted</h2>
            <p>Your assignment "${data.content.assignmentName}" has been graded.</p>
            <p>Grade: ${data.content.grade}</p>
            <p>Class: ${data.content.className}</p>
            <p>Graded by: ${data.content.teacherName}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'Error sending email');
    }
});
