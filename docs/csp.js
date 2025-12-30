(function () {
  // Replit のプレビュー/ワークスペース内でのみ true
  var isReplitPreview = location.hostname.endsWith(".replit.dev") || location.hostname.endsWith(".repl.co");
  // 既存の CSP <meta> を除去（重複を避ける）
  document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(function(m){ m.remove(); });

  // base（本番用：厳格）
  var prod = "default-src 'self'; " +
             "img-src 'self' data: https:; " +
             "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
             "font-src 'self' data: https://fonts.gstatic.com; " +
             "script-src 'self' https://cdn.jsdelivr.net; " +
             "script-src-elem 'self' https://cdn.jsdelivr.net; " +
             "connect-src 'self' https://api.emailjs.com; " +
             "frame-ancestors 'self' https://*.replit.com; " +
             "base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

  // dev（Replit プレビュー用：beacon.js を許可 + 'unsafe-inline' for debugging）
  var dev = "default-src 'self'; " +
            "img-src 'self' data: https:; " +
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
            "font-src 'self' data: https://fonts.gstatic.com; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://replit.com https://*.replit.com; " +
            "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://replit.com https://*.replit.com; " +
            "connect-src 'self' https://api.emailjs.com https://replit.com https://*.replit.com; " +
            "frame-ancestors 'self' https://*.replit.com; " +
            "base-uri 'self'; form-action 'self'";

  var meta = document.createElement('meta');
  meta.setAttribute('http-equiv','Content-Security-Policy');
  meta.setAttribute('content', isReplitPreview ? dev : prod);
  document.head.prepend(meta);
})();