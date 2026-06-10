<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $emailSubject }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .wrapper {
            max-width: 560px;
            margin: 40px auto;
            background: #ffffff;
            border: 2px solid #111;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 4px 4px 0 #111;
        }

        .header {
            background: #A3E635;
            padding: 28px 32px;
            border-bottom: 2px solid #111;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            color: #111;
            letter-spacing: -0.5px;
        }

        .body {
            padding: 32px;
            font-size: 15px;
            color: #374151;
            line-height: 1.7;
        }

        .body p {
            margin: 0 0 14px;
        }

        .body strong {
            color: #111;
        }

        .footer {
            padding: 20px 32px;
            border-top: 2px solid #f4f4f5;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="header">
            <h1>CKC IT CLUB</h1>
        </div>
        <div class="body">
            {!! $emailBody !!}
        </div>
        <div class="footer">
            © {{ date('Y') }} CKC IT CLUB<br />Trường Cao đẳng Kỹ thuật Cao Thắng
        </div>
    </div>
</body>

</html>
