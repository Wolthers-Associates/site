const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse form data
    const params = new URLSearchParams(event.body);
    const formData = {
      name: params.get('name'),
      email: params.get('email'),
      department: params.get('department'),
      departmentEmail: params.get('department-email'),
      subject: params.get('subject'),
      message: params.get('message')
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.department || !formData.subject || !formData.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Email configuration (you'll need to set these environment variables in Netlify)
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your app password
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: formData.departmentEmail,
      replyTo: formData.email,
      subject: `Website Contact: ${formData.subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Department:</strong> ${formData.department}</p>
        <p><strong>Subject:</strong> ${formData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>This message was sent from the Wolthers & Associates website contact form.</small></p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success
    return {
      statusCode: 302,
      headers: {
        Location: '/?success=true'
      }
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send email' })
    };
  }
};