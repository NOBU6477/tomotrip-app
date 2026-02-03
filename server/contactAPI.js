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

  getAutoReplySubject(type) {
    const typeLabels = {
      guide: 'ガイド',
      tourist: '観光客',
      sponsor: '協賛店'
    };
    const label = typeLabels[type] || '一般';
    return `【TomoTrip｜${label}】お問い合わせありがとうございます`;
  }

  getAutoReplyGreeting(type) {
    const greetings = {
      tourist: 'このたびは TomoTrip（旅友） へお問い合わせいただき、',
      guide: 'このたびは TomoTrip（旅友）へお問い合わせ（ガイド向け）いただき、',
      sponsor: 'このたびは TomoTrip（旅友）へお問い合わせ（協賛店向け）いただき、'
    };
    return greetings[type] || greetings.tourist;
  }

  buildAutoReplyContent(data, type = 'tourist') {
    const greeting = this.getAutoReplyGreeting(type);
    
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
      line-height: 1.8;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 560px; 
      margin: 0 auto; 
      padding: 24px 16px;
    }
    .content { 
      background: #fff; 
      padding: 24px;
      border-radius: 8px;
    }
    .greeting {
      font-size: 15px;
      margin-bottom: 20px;
    }
    .body-text {
      font-size: 14px;
      margin-bottom: 20px;
    }
    .divider {
      border: none;
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }
    .info-block {
      font-size: 14px;
      margin: 12px 0;
    }
    .info-label {
      font-weight: bold;
      margin-bottom: 4px;
    }
    .info-content {
      margin: 0;
      padding-left: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .notice {
      font-size: 12px;
      color: #666;
      margin-top: 24px;
      line-height: 1.7;
    }
    .footer {
      font-size: 12px;
      color: #666;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
    .footer a {
      color: #0077b6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p class="greeting">${this.escapeHtml(data.name)} 様</p>
      
      <p class="body-text">
        ${greeting}<br>
        誠にありがとうございます。
      </p>
      
      <p class="body-text">
        以下の内容で、お問い合わせを受け付けいたしました。
      </p>
      
      <p class="body-text">
        内容を確認のうえ、必要に応じて<br>
        担当者より順次ご連絡いたします。<br>
        今しばらくお待ちくださいませ。
      </p>
      
      <hr class="divider">
      
      <div class="info-block">
        <p class="info-label">【お名前】</p>
        <p class="info-content">${this.escapeHtml(data.name)}</p>
      </div>
      
      <div class="info-block">
        <p class="info-label">【メールアドレス】</p>
        <p class="info-content">${data.email}</p>
      </div>
      
      <div class="info-block">
        <p class="info-label">【お問い合わせ内容】</p>
        <p class="info-content">${this.escapeHtml(data.message)}</p>
      </div>
      
      <hr class="divider">
      
      <div class="notice">
        <p style="margin: 0 0 8px 0;">※ このメールは自動送信されています。</p>
        <p style="margin: 0 0 12px 0;">※ 本メールに直接ご返信いただいても、<br>
        　お答えできない場合がございます。</p>
        <p style="margin: 0;">ご不明点や追加のご質問がございましたら、<br>
        下記までお気軽にご連絡ください。</p>
      </div>
      
      <div class="footer">
        <p style="margin: 0 0 4px 0;">─────────────────</p>
        <p style="margin: 0 0 8px 0; font-weight: bold;">TomoTrip（旅友）</p>
        <p style="margin: 0;">
          公式サイト：<a href="https://tomotrip.com">https://tomotrip.com</a><br>
          お問い合わせ：<a href="mailto:info@tomotrip.com">info@tomotrip.com</a>
        </p>
        <p style="margin: 4px 0 0 0;">─────────────────</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const textGreeting = this.getAutoReplyGreeting(type).replace('、', '');
    const text = `${data.name} 様

${textGreeting}
誠にありがとうございます。

以下の内容で、お問い合わせを受け付けいたしました。

内容を確認のうえ、必要に応じて
担当者より順次ご連絡いたします。
今しばらくお待ちくださいませ。

─────────────────
【お名前】 ${data.name}
【メールアドレス】 ${data.email}

【お問い合わせ内容】
${data.message}
─────────────────

※ このメールは自動送信されています。
※ 本メールに直接ご返信いただいても、
　お答えできない場合がございます。

ご不明点や追加のご質問がございましたら、
下記までお気軽にご連絡ください。

─────────────────
TomoTrip（旅友）
公式サイト：https://tomotrip.com
お問い合わせ：info@tomotrip.com
─────────────────
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

        const autoReplySubject = this.getAutoReplySubject(type);
        const { html: autoReplyHtml, text: autoReplyText } = this.buildAutoReplyContent(contactData, type);

        const [adminEmailResult, autoReplyResult] = await Promise.all([
          this.emailService.sendEmailWithReplyTo(
            this.contactEmail,
            adminSubject,
            adminHtml,
            adminText,
            email
          ),
          this.emailService.sendEmailWithReplyTo(
            email,
            autoReplySubject,
            autoReplyHtml,
            autoReplyText,
            this.contactEmail
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
