import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sumopod.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendVerificationEmail(to: string, name: string, verificationLink: string) {
  await transporter.sendMail({
    from: `"AppGuru" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verifikasi Email AppGuru',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Halo ${name},</h2>
        <p style="color:#555;margin:0 0 24px">Terima kasih telah mendaftar di AppGuru. Klik tombol di bawah untuk memverifikasi email Anda.</p>
        <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;border-radius:12px;text-decoration:none;font-weight:600">Verifikasi Email</a>
        <p style="color:#999;font-size:12px;margin-top:24px">Atau salin link ini: ${verificationLink}</p>
      </div>
    `,
  });
}