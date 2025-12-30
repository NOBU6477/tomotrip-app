// Emergency button handlers for new tab compatibility
// Ensures buttons work in all browser contexts, including new tabs

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Emergency button setup started');
    
    // Language switcher buttons
    const jpBtn = document.getElementById('jpBtn');
    const enBtn = document.getElementById('enBtn');
    
    if (jpBtn && !jpBtn.hasAttribute('data-listener-added')) {
        jpBtn.addEventListener('click', function() {
            console.log('🇯🇵 Japanese selected - staying on current page');
            alert('既に日本語版を表示しています');
        });
        jpBtn.setAttribute('data-listener-added', 'true');
        console.log('✅ Japanese button setup complete');
    }
    
    if (enBtn && !enBtn.hasAttribute('data-listener-added')) {
        enBtn.addEventListener('click', function() {
            console.log('🇺🇸 English selected - switching to English page');
            window.location.href = 'index-en.html';
        });
        enBtn.setAttribute('data-listener-added', 'true');
        console.log('✅ English button setup complete');
    }
    
    // Sponsor buttons
    const sponsorRegBtn = document.getElementById('sponsorRegBtn');
    const sponsorLoginBtn = document.getElementById('sponsorLoginBtn');
    
    if (sponsorRegBtn && !sponsorRegBtn.hasAttribute('data-listener-added')) {
        sponsorRegBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Sponsor registration clicked - redirecting');
            window.location.href = 'sponsor-registration.html';
        });
        sponsorRegBtn.setAttribute('data-listener-added', 'true');
        console.log('✅ Registration button setup complete');
    }
    
    if (sponsorLoginBtn && !sponsorLoginBtn.hasAttribute('data-listener-added')) {
        sponsorLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Sponsor login clicked');
            alert('協賛店ログインモーダルを準備中です');
        });
        sponsorLoginBtn.setAttribute('data-listener-added', 'true');
        console.log('✅ Login button setup complete');
    }
    
    console.log('🎯 Emergency button setup finished');
});