<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4F46E5;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px 20px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background-color: #4338CA;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reset Your Password</h1>
    </div>
    
    <div class="content">
        <p>Hello {{ $user->name }},</p>
        
        <p>We received a request to reset your password for your Fleet Management account. Click the button below to create a new password:</p>
        
        <center>
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </center>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">{{ $resetUrl }}</p>
        
        <div class="warning">
            <strong>Security Notice:</strong> This link will expire in {{ $expiresIn }} minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </div>
        
        <p>For security reasons, all your existing sessions will be logged out once you reset your password.</p>
    </div>
    
    <div class="footer">
        <p>© {{ date('Y') }} Fleet Management Platform. All rights reserved.</p>
        <p>This is an automated email. Please do not reply to this message.</p>
    </div>
</body>
</html>
