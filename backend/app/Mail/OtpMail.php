<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly string $userName = '',
        public readonly string $purpose = 'forgot_password', // 'forgot_password' | 'registration'
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = $this->purpose === 'registration'
            ? '[CKC IT CLUB] Xác nhận đăng ký tài khoản'
            : '[CKC IT CLUB] Mã xác nhận đặt lại mật khẩu';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
        );
    }
}
