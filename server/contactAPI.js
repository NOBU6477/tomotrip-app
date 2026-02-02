const { EmailService } = require('./emailService');

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

  buildAutoReplyContent(data) {
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
    .header { background: linear-gradient(135deg, #00a8cc, #0077b6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00a8cc; }
    .note { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌴 TomoTrip</h1>
      <p>お問い合わせありがとうございます</p>
    </div>
    <div class="content">
      <p>${this.escapeHtml(data.name)} 様</p>
      <p>この度は TomoTrip にお問い合わせいただき、誠にありがとうございます。</p>
      <p>以下の内容でお問い合わせを受け付けました。担当者より順次ご連絡いたしますので、しばらくお待ちください。</p>
      
      <div class="message-box">
        <h3 style="margin-top: 0; color: #00a8cc;">お問い合わせ内容</h3>
        <p><strong>お問い合わせ種別:</strong> ${typeLabels[data.type] || '一般'}</p>
        <p><strong>お名前:</strong> ${this.escapeHtml(data.name)}</p>
        <p><strong>メールアドレス:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>電話番号:</strong> ${this.escapeHtml(data.phone)}</p>` : ''}
        <p><strong>お問い合わせ内容:</strong></p>
        <div style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px; border: 1px solid #e0e0e0;">${this.escapeHtml(data.message)}</div>
      </div>

      <div class="note">
        <p style="margin: 0;"><strong>ご注意:</strong> このメールは自動送信されています。このメールに直接返信されても対応できませんのでご了承ください。</p>
      </div>

      <p>今後ともTomoTripをよろしくお願いいたします。</p>
    </div>
    <div class="footer">
      <p>TomoTrip - 沖縄の素敵な体験をあなたに</p>
      <p>このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
【TomoTrip】お問い合わせありがとうございます

${data.name} 様

この度は TomoTrip にお問い合わせいただき、誠にありがとうございます。
以下の内容でお問い合わせを受け付けました。
担当者より順次ご連絡いたしますので、しばらくお待ちください。

━━━━━━━━━━━━━━━━━━━━
■ お問い合わせ内容
━━━━━━━━━━━━━━━━━━━━

お問い合わせ種別: ${typeLabels[data.type] || '一般'}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone || '未入力'}

お問い合わせ内容:
${data.message}

━━━━━━━━━━━━━━━━━━━━

※ このメールは自動送信されています。
※ このメールに直接返信されても対応できませんのでご了承ください。

今後ともTomoTripをよろしくお願いいたします。

--
TomoTrip - 沖縄の素敵な体験をあなたに
`;

    return { html, text };
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

        const contactData = {
          type,
          source: source || 'app',
          name,
          email,
          phone,
          message,
          pageUrl,
          userAgent
        };

        const adminSubject = `${this.getSubjectPrefix(type, source)}お問い合わせ｜TomoTrip`;
        const { html: adminHtml, text: adminText } = this.buildEmailContent(contactData);

        const autoReplySubject = '【TomoTrip】お問い合わせありがとうございます（自動返信）';
        const { html: autoReplyHtml, text: autoReplyText } = this.buildAutoReplyContent(contactData);

        const [adminEmailResult, autoReplyResult] = await Promise.all([
          this.emailService.sendEmailWithReplyTo(
            this.contactEmail,
            adminSubject,
            adminHtml,
            adminText,
            email
          ),
          this.emailService.sendEmail(
            email,
            autoReplySubject,
            autoReplyHtml,
            autoReplyText
          )
        ]).catch(error => {
          console.error(`❌ [CONTACT] Promise.all error: ${error.message}`);
          return [{ success: false, error: error.message }, { success: false, error: error.message }];
        });

        const duration = Date.now() - startTime;

        if (adminEmailResult.success) {
          if (autoReplyResult.success) {
            console.log(`✅ [CONTACT] OK type=${type} source=${source || 'app'} email=${this.maskEmail(email)} admin=OK autoreply=OK 201 (${duration}ms)`);
          } else {
            console.error(`⚠️ [CONTACT] WARN: Auto-reply failed for ${this.maskEmail(email)}: ${autoReplyResult.error}`);
            console.log(`✅ [CONTACT] OK type=${type} source=${source || 'app'} email=${this.maskEmail(email)} admin=OK autoreply=FAIL 201 (${duration}ms)`);
          }
          return res.status(201).json({ 
            success: true, 
            mode: adminEmailResult.provider === 'simulation' ? 'simulation' : 'production',
            messageId: adminEmailResult.messageId,
            autoReply: autoReplyResult.success
          });
        } else {
          console.error(`❌ [CONTACT] FAIL reason=EMAIL_SEND_ERROR email=${this.maskEmail(email)} error=${adminEmailResult.error}`);
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
