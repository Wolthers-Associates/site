// Contact form handler - replaces contact.php
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, department, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // In a real implementation, you would send the email here
    // For now, we'll log it and return success
    console.log('Contact form submission:', {
      name,
      email,
      department,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // TODO: Integrate with your preferred email service
    // Examples: SendGrid, AWS SES, Nodemailer, etc.
    
    // For now, return success
    res.status(200).json({ 
      success: true,
      message: 'Thank you for your message. We will get back to you soon!' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}