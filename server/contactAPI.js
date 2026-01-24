const EmailService = require('./emailService');

class ContactAPIService {
  constructor() {
    this.emailService = new EmailService();
    this.contactEmail = process.env.CONTACT_EMAIL || 'info@tomotrip.com';
  }

  maskEmail(email) {
    if (!email) return 'none';
    const parts = email.split('@');
    return `***@${parts[1] || 'unknown'}`;
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getSubjectPrefix(type, source) {
    const sourceLabel = source === 'lp' ? 'LP' : 'APP';
    const typeLabels = {
      guide: 'ガイド',
      tourist: '観光客',
      sponsor: '協賛店'
    };
    const typeLabel = typeLabels[type] || '一般';
    return `【${sourceLabel}｜${typeLabel}】`;
  }

  formatJSTDate(date) {
    return new Date(date).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  buildEmailContent(data) {
    const typeLabels = {
      guide: 'ガイド',
      tourist: '観光客',
      sponsor: '協賛店'
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0077b6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 4px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0; }
    .message-box { white-space: pre-wrap; min-height: 100px; }
    .meta { font-size: 12px; color: #888; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">TomoTrip お問い合わせ</h2>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${typeLabels[data.type] || '一般'}からのお問い合わせ</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">お問い合わせ種別</div>
        <div class="value">${typeLabels[data.type] || '一般'} / ソース: ${data.source || 'app'}</div>
      </div>
      <div class="field">
        <div class="label">お名前</div>
        <div class="value">${this.escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="label">メールアドレス</div>
        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">電話番号</div>
        <div class="value">${this.escapeHtml(data.phone)}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">お問い合わせ内容</div>
        <div class="value message-box">${this.escapeHtml(data.message)}</div>
      </div>
      <div class="meta">
        <p><strong>送信日時:</strong> ${this.formatJSTDate(new Date())}</p>
        <p><strong>送信元URL:</strong> ${data.pageUrl || '不明'}</p>
        <p><strong>UserAgent:</strong> ${data.userAgent || '不明'}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
TomoTrip お問い合わせ
====================

種別: ${typeLabels[data.type] || '一般'} / ソース: ${data.source || 'app'}

お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone || '未入力'}

お問い合わせ内容:
${data.message}

---
送信日時: ${this.formatJSTDate(new Date())}
送信元URL: ${data.pageUrl || '不明'}
UserAgent: ${data.userAgent || '不明'}
`;

    return { html, text };
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  initRoutes(app) {
    app.post('/api/contact', async (req, res) => {
      const startTime = Date.now();
      
      try {
        const { type, source, name, email, phone, message, pageUrl, userAgent } = req.body;

        if (!name || !email || !message || !type) {
          console.log(`❌ [CONTACT] FAIL reason=MISSING_REQUIRED_FIELDS email=${this.maskEmail(email)} 400`);
          return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_FIELDS' });
        }

        if (!this.validateEmail(email)) {
          console.log(`❌ [CONTACT] FAIL reason=INVALID_EMAIL email=${this.maskEmail(email)} 400`);
          return res.status(400).json({ success: false, error: 'INVALID_EMAIL' });
        }

        if (message.trim().length < 10) {
          console.log(`❌ [CONTACT] FAIL reason=MESSAGE_TOO_SHORT email=${this.maskEmail(email)} 400`);
          return res.status(400).json({ success: false, error: 'MESSAGE_TOO_SHORT' });
        }

        const validTypes = ['guide', 'tourist', 'sponsor'];
        if (!validTypes.includes(type)) {
          console.log(`❌ [CONTACT] FAIL reason=INVALID_TYPE type=${type} 400`);
          return res.status(400).json({ success: false, error: 'INVALID_TYPE' });
        }

        const subject = `${this.getSubjectPrefix(type, source)}お問い合わせ｜TomoTrip`;
        const { html, text } = this.buildEmailContent({
          type,
          source: source || 'app',
          name,
          email,
          phone,
          message,
          pageUrl,
          userAgent
        });

        const emailResult = await this.emailService.sendEmailWithReplyTo(
          this.contactEmail,
          subject,
          html,
          text,
          email
        );

        const duration = Date.now() - startTime;

        if (emailResult.success) {
          console.log(`✅ [CONTACT] OK type=${type} source=${source || 'app'} email=${this.maskEmail(email)} 201 (${duration}ms)`);
          return res.status(201).json({ 
            success: true, 
            mode: emailResult.provider === 'simulation' ? 'simulation' : 'production',
            messageId: emailResult.messageId
          });
        } else {
          console.log(`❌ [CONTACT] FAIL reason=EMAIL_SEND_ERROR email=${this.maskEmail(email)} error=${emailResult.error} 500`);
          return res.status(500).json({ success: false, error: 'EMAIL_SEND_ERROR' });
        }

      } catch (error) {
        console.error(`❌ [CONTACT] FAIL reason=SERVER_ERROR error=${error.message} 500`);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
      }
    });

    console.log('✅ Contact API routes initialized');
  }
}

const contactAPIService = new ContactAPIService();
module.exports = { contactAPIService };
