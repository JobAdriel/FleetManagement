<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $token
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify Your Email - Fleet Management',
        );
    }

    public function content(): Content
    {
        $verifyUrl = config('app. frontend_url') . '/verify-email?token=' . $this->token;

        return new Content(
            view: 'emails.email-verification',
            with: [
                'user' => $this->user,
                'verifyUrl' => $verifyUrl,
                'expiresIn' => 24, // hours
            ],
        );
    }
}
