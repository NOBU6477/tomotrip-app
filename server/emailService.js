// Email Service for TomoTrip - 予約自動メール配信
// Supports: SendGrid, Resend, or Simulation Mode
const fetch = require('node-fetch');

class EmailService {
  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@tomotrip.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'TomoTrip';
    
    if (this.sendgridApiKey) {
      this.provider = 'sendgrid';
      console.log('✅ Email service initialized with SendGrid');
    } else if (this.resendApiKey) {
      this.provider = 'resend';
      console.log('✅ Email service initialized with Resend');
    } else {
      this.provider = 'simulation';
      console.log('📧 Email service running in SIMULATION mode (emails logged to console)');
    }
  }

  async sendEmail(to, subject, htmlContent, textContent) {
    const emailData = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html: htmlContent,
      text: textContent || this.stripHtml(htmlContent)
    };

    if (this.provider === 'simulation') {
      return this.simulateSend(emailData);
    } else if (this.provider === 'sendgrid') {
      return this.sendWithSendGrid(emailData);
    } else if (this.provider === 'resend') {
      return this.sendWithResend(emailData);
    }
  }

  simulateSend(emailData) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL SIMULATION - Would send:');
    console.log('='.repeat(60));
    console.log(`To: ${emailData.to}`);
    console.log(`From: ${emailData.from}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('-'.repeat(60));
    console.log('Content:');
    console.log(emailData.text);
    console.log('='.repeat(60) + '\n');
    
    return {
      success: true,
      messageId: 'SIM-' + Date.now(),
      provider: 'simulation'
    };
  }

  async sendWithSendGrid(emailData) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailData.to }] }],
          from: { email: this.fromEmail, name: this.fromName },
          subject: emailData.subject,
          content: [
            { type: 'text/plain', value: emailData.text },
            { type: 'text/html', value: emailData.html }
          ]
        })
      });

      if (response.ok || response.status === 202) {
        console.log(`✅ Email sent via SendGrid to ${emailData.to}`);
        return { success: true, provider: 'sendgrid' };
      } else {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return { success: false, error, provider: 'sendgrid' };
      }
    } catch (error) {
      console.error('SendGrid send failed:', error);
      return { success: false, error: error.message, provider: 'sendgrid' };
    }
  }

  async sendWithResend(emailData) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Email sent via Resend to ${emailData.to}`);
        return { success: true, messageId: result.id, provider: 'resend' };
      } else {
        console.error('Resend error:', result);
        return { success: false, error: result, provider: 'resend' };
      }
    } catch (error) {
      console.error('Resend send failed:', error);
      return { success: false, error: error.message, provider: 'resend' };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  async sendReservationConfirmationToCustomer(reservation, store) {
    const subject = `【TomoTrip】ご予約リクエストを受け付けました - ${store.storeName}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00a8cc, #0077b6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: bold; width: 120px; color: #555; }
    .highlight { color: #00a8cc; font-weight: bold; }
    .note { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TomoTrip</h1>
      <p>予約リクエスト受付完了</p>
    </div>
    <div class="content">
      <p>${reservation.customerName} 様</p>
      <p>この度は<strong>${store.storeName}</strong>へのご予約リクエストをいただき、誠にありがとうございます。</p>
      <p>以下の内容でご予約リクエストを承りました。店舗からの確認連絡をお待ちください。</p>
      
      <div class="detail-box">
        <h3 style="margin-top: 0; color: #00a8cc;">ご予約内容</h3>
        <div class="detail-row">
          <span class="detail-label">店舗名:</span>
          <span>${store.storeName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ご予約日:</span>
          <span class="highlight">${this.formatDate(reservation.reservationDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ご予約時間:</span>
          <span class="highlight">${reservation.reservationTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">人数:</span>
          <span>${reservation.numberOfGuests}名様</span>
        </div>
        ${reservation.notes ? `
        <div class="detail-row">
          <span class="detail-label">ご要望:</span>
          <span>${reservation.notes}</span>
        </div>` : ''}
      </div>

      <div class="note">
        <strong>ご注意:</strong> このメールは予約リクエストの受付確認です。店舗からの確認連絡をもって予約確定となります。
      </div>

      <p>ご不明な点がございましたら、店舗まで直接お問い合わせください。</p>
      ${store.phone ? `<p>店舗電話番号: <strong>${store.phone}</strong></p>` : ''}
      
      <p>素敵な旅のひとときをお過ごしください。</p>
    </div>
    <div class="footer">
      <p>TomoTrip - 沖縄の素敵な体験をあなたに</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
【TomoTrip】ご予約リクエストを受け付けました

${reservation.customerName} 様

この度は${store.storeName}へのご予約リクエストをいただき、誠にありがとうございます。

■ ご予約内容
━━━━━━━━━━━━━━━━━━━━
店舗名: ${store.storeName}
ご予約日: ${this.formatDate(reservation.reservationDate)}
ご予約時間: ${reservation.reservationTime}
人数: ${reservation.numberOfGuests}名様
${reservation.notes ? `ご要望: ${reservation.notes}` : ''}
━━━━━━━━━━━━━━━━━━━━

※ このメールは予約リクエストの受付確認です。
※ 店舗からの確認連絡をもって予約確定となります。

ご不明な点がございましたら、店舗まで直接お問い合わせください。
${store.phone ? `店舗電話番号: ${store.phone}` : ''}

素敵な旅のひとときをお過ごしください。

--
TomoTrip - 沖縄の素敵な体験をあなたに
`;

    if (!reservation.customerEmail) {
      console.log('⚠️ Customer email not provided, skipping customer notification');
      return { success: false, reason: 'no_email' };
    }

    return this.sendEmail(reservation.customerEmail, subject, htmlContent, textContent);
  }

  async sendReservationNotificationToStore(reservation, store) {
    const subject = `【新規予約】${reservation.customerName}様より予約リクエストがありました`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .detail-box { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .customer-box { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .highlight { color: #28a745; font-weight: bold; font-size: 18px; }
    .action-btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>新規予約リクエスト</h1>
      <p>TomoTrip 予約管理システム</p>
    </div>
    <div class="content">
      <p>${store.storeName} 様</p>
      <p>新しい予約リクエストが入りました。内容をご確認の上、お客様への対応をお願いいたします。</p>
      
      <div class="detail-box">
        <h3 style="margin-top: 0; color: #28a745;">予約内容</h3>
        <div class="detail-row">
          <span class="detail-label">予約日時:</span><br>
          <span class="highlight">${this.formatDate(reservation.reservationDate)} ${reservation.reservationTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">人数:</span>
          <span>${reservation.numberOfGuests}名様</span>
        </div>
        ${reservation.notes ? `
        <div class="detail-row">
          <span class="detail-label">お客様からのご要望:</span><br>
          <span>${reservation.notes}</span>
        </div>` : ''}
      </div>

      <div class="customer-box">
        <h3 style="margin-top: 0; color: #1976d2;">お客様情報</h3>
        <div class="detail-row">
          <span class="detail-label">お名前:</span>
          <span>${reservation.customerName}</span>
        </div>
        ${reservation.customerEmail ? `
        <div class="detail-row">
          <span class="detail-label">メール:</span>
          <span>${reservation.customerEmail}</span>
        </div>` : ''}
        ${reservation.customerPhone ? `
        <div class="detail-row">
          <span class="detail-label">電話番号:</span>
          <span>${reservation.customerPhone}</span>
        </div>` : ''}
      </div>

      <p>店舗ダッシュボードから予約の確認・管理を行ってください。</p>
      
      <p style="margin-top: 30px;">
        <strong>対応が必要な項目:</strong>
      </p>
      <ol>
        <li>予約内容の確認</li>
        <li>お客様への確認連絡</li>
        <li>予約ステータスの更新（確定/キャンセル）</li>
      </ol>
    </div>
    <div class="footer">
      <p>TomoTrip 店舗パートナー向け通知</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
【新規予約リクエスト】TomoTrip

${store.storeName} 様

新しい予約リクエストが入りました。

■ 予約内容
━━━━━━━━━━━━━━━━━━━━
予約日時: ${this.formatDate(reservation.reservationDate)} ${reservation.reservationTime}
人数: ${reservation.numberOfGuests}名様
${reservation.notes ? `ご要望: ${reservation.notes}` : ''}
━━━━━━━━━━━━━━━━━━━━

■ お客様情報
━━━━━━━━━━━━━━━━━━━━
お名前: ${reservation.customerName}
${reservation.customerEmail ? `メール: ${reservation.customerEmail}` : ''}
${reservation.customerPhone ? `電話番号: ${reservation.customerPhone}` : ''}
━━━━━━━━━━━━━━━━━━━━

対応が必要な項目:
1. 予約内容の確認
2. お客様への確認連絡
3. 予約ステータスの更新（確定/キャンセル）

店舗ダッシュボードから予約の確認・管理を行ってください。

--
TomoTrip 店舗パートナー向け通知
`;

    if (!store.email) {
      console.log('⚠️ Store email not found, skipping store notification');
      return { success: false, reason: 'no_email' };
    }

    return this.sendEmail(store.email, subject, htmlContent, textContent);
  }

  async sendGuideReservationConfirmation(reservation) {
    const subject = `【TomoTrip】ガイド予約リクエストを受け付けました`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00a8cc, #0077b6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; display: inline-block; width: 120px; }
    .highlight { color: #00a8cc; font-weight: bold; }
    .note { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .reservation-id { font-family: monospace; background: #e9ecef; padding: 5px 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌴 TomoTrip</h1>
      <p>ガイド予約リクエスト受付完了</p>
    </div>
    <div class="content">
      <p>${reservation.customerName} 様</p>
      <p>この度は<strong>${reservation.guideName || 'ガイド'}</strong>へのご予約リクエストをいただき、誠にありがとうございます。</p>
      <p>以下の内容でご予約リクエストを承りました。ガイドからの確認連絡をお待ちください。</p>
      
      <div class="detail-box">
        <h3 style="margin-top: 0; color: #00a8cc;">📋 ご予約内容</h3>
        <div class="detail-row">
          <span class="detail-label">予約ID:</span>
          <span class="reservation-id">${reservation.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ガイド名:</span>
          <span>${reservation.guideName || 'ガイド'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ご予約日:</span>
          <span class="highlight">${this.formatDate(reservation.reservationDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ご予約時間:</span>
          <span class="highlight">${reservation.reservationTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">人数:</span>
          <span>${reservation.numberOfGuests}名様</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">連絡先電話:</span>
          <span>${reservation.customerPhone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">メール:</span>
          <span>${reservation.customerEmail}</span>
        </div>
        ${reservation.notes ? `
        <div class="detail-row">
          <span class="detail-label">ご要望:</span>
          <span>${reservation.notes}</span>
        </div>` : ''}
      </div>

      <div class="note">
        <strong>⚠️ ご注意:</strong> このメールは予約リクエストの受付確認です。ガイドからの確認連絡をもって予約確定となります。
      </div>
      
      <p>ご不明点がございましたら、お気軽にお問い合わせください。</p>
      <p>素敵な旅になりますように！</p>
    </div>
    <div class="footer">
      <p>🌴 TomoTrip - 特別な旅の体験を</p>
      <p>© 2026 TomoTrip. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    const textContent = `
【TomoTrip】ガイド予約リクエスト受付完了

${reservation.customerName} 様

この度は ${reservation.guideName || 'ガイド'} へのご予約リクエストをいただき、誠にありがとうございます。

■ ご予約内容
予約ID: ${reservation.id}
ガイド名: ${reservation.guideName || 'ガイド'}
ご予約日: ${this.formatDate(reservation.reservationDate)}
ご予約時間: ${reservation.reservationTime}
人数: ${reservation.numberOfGuests}名様
連絡先電話: ${reservation.customerPhone}
メール: ${reservation.customerEmail}
${reservation.notes ? `ご要望: ${reservation.notes}` : ''}

※このメールは予約リクエストの受付確認です。ガイドからの確認連絡をもって予約確定となります。

素敵な旅になりますように！

🌴 TomoTrip
`;

    if (!reservation.customerEmail) {
      console.log('⚠️ Customer email not provided, skipping guide reservation email');
      return { success: false, reason: 'no_email' };
    }

    return this.sendEmail(reservation.customerEmail, subject, htmlContent, textContent);
  }
}

const emailService = new EmailService();

module.exports = { emailService, EmailService };
