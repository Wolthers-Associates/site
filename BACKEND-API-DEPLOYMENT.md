# Backend API Deployment Checklist
**Wolthers Trips - Enhanced Authentication System**

## 🗂️ Files Created/Modified

### New API Endpoints
- ✅ `trips/api/auth/check-user.php` - User existence validation
- ✅ `trips/api/auth/send-code.php` - One-time code generation and sending
- ✅ `trips/api/auth/verify-code.php` - Code verification and authentication
- ✅ `trips/api/auth/register.php` - Enhanced registration (UPDATED)

### Database Schema Updates
- ✅ `database/one-time-codes.sql` - New table for verification codes
- ✅ `database/enhanced-users.sql` - Additional columns for users table

### Testing & Documentation
- ✅ `trips/api/test-endpoints.html` - Testing interface
- ✅ `BACKEND-API-DEPLOYMENT.md` - This deployment guide

## 🗄️ Database Setup

### 1. Run Database Migrations
Execute these SQL files in order:

```bash
# 1. Add one-time codes table
mysql -u u975408171_wolthers_user -p u975408171_wolthers_trips < database/one-time-codes.sql

# 2. Update users table with new columns
mysql -u u975408171_wolthers_user -p u975408171_wolthers_trips < database/enhanced-users.sql
```

### 2. Verify Table Structure
Check that these tables exist with correct structure:

```sql
-- Verify one_time_codes table
DESCRIBE one_time_codes;

-- Verify updated users table
DESCRIBE users;

-- Check for new indexes
SHOW INDEX FROM users;
SHOW INDEX FROM one_time_codes;
```

## 🔧 Configuration

### 1. Environment Variables
Ensure these are set in your hosting environment:

```bash
# Required
ENVIRONMENT=development  # or 'production'
DB_HOST=localhost
DB_NAME=u975408171_wolthers_trips
DB_USER=u975408171_wolthers_user
DB_PASSWORD=your_database_password

# Optional (for future features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security
JWT_SECRET=your-jwt-secret-change-in-production
```

### 2. File Permissions
Ensure proper permissions on API files:

```bash
chmod 644 trips/api/auth/*.php
chmod 644 trips/api/config.php
```

## 🧪 Testing

### 1. Access Testing Interface
Navigate to: `https://yourdomain.com/trips/api/test-endpoints.html`

### 2. Test Each Endpoint

#### Test 1: User Check
- Input: `test@example.com`
- Expected: User doesn't exist response

#### Test 2: Send Code
- Purpose: `registration`
- Email: `test@example.com`
- Expected: Code sent (visible in development logs)

#### Test 3: Registration
- Use test data from interface
- Include verification code from step 2
- Expected: Account created successfully

#### Test 4: Login Flow
- Check user exists
- Send login code
- Verify code
- Expected: User logged in

### 3. Development vs Production Testing

**Development Mode:**
- Verification codes shown in responses
- Email sending simulated (logged to error log)
- More detailed error messages

**Production Mode:**
- Codes hidden from responses
- Real email sending required
- Generic error messages

## 🚀 Deployment Steps

### 1. Pre-deployment Checklist
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] File permissions set correctly
- [ ] SMTP configuration ready (for production)

### 2. Deployment Process
1. Upload all new/modified files
2. Run database migrations
3. Test endpoints using test interface
4. Verify error logging works
5. Test email functionality (production only)

### 3. Post-deployment Verification
- [ ] All endpoints respond correctly
- [ ] Database operations work
- [ ] Session management functions
- [ ] Error handling works properly

## 🔒 Security Features Implemented

### Rate Limiting
- Max 3 code requests per 15 minutes per email
- Max 3 verification attempts per code
- Account lockout after 5 failed login attempts

### Code Security
- 6-digit random codes
- 15-minute expiration
- Single-use only
- Secure storage with hashing

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS protection

### Session Security
- Secure session management
- IP address logging
- User agent tracking
- Activity logging

## 📧 Email Configuration (Production)

For production deployment, implement actual email sending in `send-code.php`:

```php
// Replace the placeholder sendEmail function with:
function sendEmail($to, $subject, $htmlBody) {
    // Use PHPMailer, SendGrid, or similar service
    // Example with PHPMailer:
    /*
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    
    $mail->setFrom(SMTP_USER, 'Wolthers & Associates');
    $mail->addAddress($to);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $htmlBody;
    
    return $mail->send();
    */
    return true; // Placeholder
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check credentials in config.php
   - Verify database exists
   - Check user permissions

2. **Missing Table Errors**
   - Run database migrations
   - Check table names match exactly

3. **Email Not Sending (Development)**
   - Check error logs for simulated emails
   - Codes are logged with format: `EMAIL SIMULATION - To: email, Code: 123456`

4. **Session Issues**
   - Ensure session directory is writable
   - Check session configuration in PHP

5. **CORS Errors**
   - Headers already set in config.php
   - Check if additional CORS configuration needed

### Debug Mode
Set `ENVIRONMENT=development` to enable:
- Detailed error messages
- Code visibility in responses
- Email simulation logging
- Enhanced debugging output

## 📊 Monitoring

### Log Files to Monitor
- PHP error log (for general errors)
- Application activity log (custom logging)
- Database slow query log
- Web server access logs

### Key Metrics
- Code generation rate
- Verification success rate
- Failed login attempts
- Registration completion rate

## 🔄 Next Steps

After successful deployment:

1. **Integrate Frontend**
   - Update login forms to use new endpoints
   - Implement code verification UI
   - Add registration flow

2. **Production Email Setup**
   - Configure SMTP service
   - Test email delivery
   - Set up email templates

3. **Enhanced Security**
   - Implement CAPTCHA for registration
   - Add device fingerprinting
   - Set up monitoring alerts

4. **Performance Optimization**
   - Add database query caching
   - Implement code cleanup job
   - Monitor response times

---

## 🎯 Quick Start for Your Hosting

### Your Database Details:
- **Host:** localhost
- **Database:** `u975408171_wolthers_trips`
- **Username:** `u975408171_wolthers_user`
- **Password:** [You need to provide this]

### If You Already Have secure-config.php:
✅ **Great! You're ahead of the game.** Just verify these settings:

1. **JWT_SECRET** - Replace the placeholder with a strong 32+ character secret:
   ```php
   define('JWT_SECRET', 'your-strong-32-character-secret-here');
   ```

2. **Environment Setting** - For testing, consider temporarily using:
   ```php
   define('ENVIRONMENT', 'development'); // Shows codes in responses for testing
   ```
   Switch back to `'production'` after testing.

3. **SMTP Settings** - Only needed for production email sending (can skip for now)

### Immediate Next Steps:
1. **Upload all files** to your hosting
2. **Run database migrations** using the commands above
3. **Set your database password** in hosting environment variables or `secure-config.php`
4. **Test the API** using: `https://yourdomain.com/trips/api/test-endpoints.html`

### Environment Variable Setup:
In your hosting control panel, set:
```
DB_PASSWORD=your_actual_database_password
ENVIRONMENT=development
```

---

**Status:** ✅ Ready for Deployment  
**Database:** Configured for u975408171_wolthers_trips  
**Last Updated:** $(date)  
**Environment:** Development/Testing Phase 