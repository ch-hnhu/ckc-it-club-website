<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã xác nhận đặt lại mật khẩu</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border: 2px solid #111; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0 #111; }
        .header { background: #A3E635; padding: 28px 32px; border-bottom: 2px solid #111; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
        .body { padding: 32px; }
        .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
        .otp-box { background: #f9fafb; border: 2px solid #111; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 3px 3px 0 #111; }
        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 8px; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #111; font-family: 'Courier New', monospace; }
        .note { font-size: 13px; color: #6b7280; line-height: 1.6; }
        .note strong { color: #374151; }
        .warning { margin-top: 20px; padding: 12px 16px; background: #fef3c7; border: 1.5px solid #f59e0b; border-radius: 8px; font-size: 13px; color: #92400e; }
        .footer { padding: 20px 32px; border-top: 2px solid #f4f4f5; font-size: 12px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>CKC IT Club</h1>
        </div>
        <div class="body">
            @if($userName)
            <p class="greeting">Xin chào <strong>{{ $userName }}</strong>,</p>
            @else
            <p class="greeting">Xin chào,</p>
            @endif

            <p class="note">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây:</p>

            <div class="otp-box">
                <div class="otp-label">Mã xác nhận</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>

            <p class="note">
                Mã có hiệu lực trong <strong>10 phút</strong>.<br>
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
            </p>

            <div class="warning">
                ⚠️ Không chia sẻ mã này với bất kỳ ai. CKC IT Club sẽ không bao giờ hỏi mã OTP của bạn.
            </div>
        </div>
        <div class="footer">
            © {{ date('Y') }} CKC IT Club — Trường Cao đẳng Kỹ thuật Cao Thắng
        </div>
    </div>
</body>
</html>
