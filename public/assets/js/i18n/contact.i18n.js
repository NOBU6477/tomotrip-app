const contactI18n = {
  ja: {
    pageTitle: 'お問い合わせ - TomoTrip',
    formTitle: 'お問い合わせ',
    types: {
      guide: { title: 'ガイドの方のお問い合わせ', label: 'ガイド向け' },
      tourist: { title: '観光客の方のお問い合わせ', label: '観光客向け' },
      sponsor: { title: '協賛店の方のお問い合わせ', label: '協賛店向け' }
    },
    labels: {
      name: 'お名前',
      email: 'メールアドレス',
      phone: '電話番号（任意）',
      message: 'お問い合わせ内容'
    },
    placeholders: {
      name: '山田 太郎',
      email: 'example@email.com',
      phone: '090-1234-5678',
      message: 'お問い合わせ内容をご記入ください（10文字以上）'
    },
    required: '*',
    charCount: '/ 10文字以上',
    submitText: '送信する',
    submitting: '送信中...',
    backLink: '← トップページに戻る',
    validation: {
      nameRequired: 'お名前を入力してください',
      emailInvalid: '有効なメールアドレスを入力してください',
      messageMinLength: 'お問い合わせ内容を10文字以上で入力してください'
    },
    alerts: {
      validationError: '入力内容を確認してください',
      successProduction: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。',
      successSimulation: '送信完了しました（テストモード：実際のメールは送信されていません）',
      networkError: '通信エラーが発生しました。ネットワーク接続を確認してください。',
      errors: {
        MISSING_REQUIRED_FIELDS: '必須項目を入力してください',
        INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
        MESSAGE_TOO_SHORT: 'メッセージは10文字以上で入力してください',
        INVALID_TYPE: '不正なお問い合わせタイプです'
      },
      defaultError: '送信に失敗しました。しばらく後にもう一度お試しください。'
    }
  },
  en: {
    pageTitle: 'Contact Us - TomoTrip',
    formTitle: 'Contact Us',
    types: {
      guide: { title: 'Guide Inquiry', label: 'For Guides' },
      tourist: { title: 'Tourist Inquiry', label: 'For Tourists' },
      sponsor: { title: 'Partnership Inquiry', label: 'For Partners' }
    },
    labels: {
      name: 'Your Name',
      email: 'Email Address',
      phone: 'Phone Number (Optional)',
      message: 'Your Message'
    },
    placeholders: {
      name: 'John Smith',
      email: 'example@email.com',
      phone: '+81-90-1234-5678',
      message: 'Please enter your message (minimum 10 characters)'
    },
    required: '*',
    charCount: '/ min 10 characters',
    submitText: 'Submit',
    submitting: 'Sending...',
    backLink: '← Back to Home',
    validation: {
      nameRequired: 'Please enter your name',
      emailInvalid: 'Please enter a valid email address',
      messageMinLength: 'Please enter at least 10 characters'
    },
    alerts: {
      validationError: 'Please check your input',
      successProduction: 'Your inquiry has been submitted. We will get back to you soon.',
      successSimulation: 'Submission complete (Test mode: No actual email was sent)',
      networkError: 'A network error occurred. Please check your connection.',
      errors: {
        MISSING_REQUIRED_FIELDS: 'Please fill in all required fields',
        INVALID_EMAIL: 'Invalid email format',
        MESSAGE_TOO_SHORT: 'Message must be at least 10 characters',
        INVALID_TYPE: 'Invalid inquiry type'
      },
      defaultError: 'Submission failed. Please try again later.'
    }
  }
};

function getContactTranslations(lang) {
  const normalizedLang = (lang || '').toString().trim().toLowerCase();
  return contactI18n[normalizedLang] || contactI18n.ja;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { contactI18n, getContactTranslations };
}
