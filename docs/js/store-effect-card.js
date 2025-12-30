(function(){
  const el = document.getElementById('store-effect-card');
  const topEl = document.getElementById('top-contributors');
  if(!el || !topEl) return;
  if(!window.FEATURES?.ENABLE_PAYOUTS) return;

  const STORE_ID = window.STORE_ID || document.body.dataset.storeId;
  if(!STORE_ID){ 
    el.innerHTML = '<div class="alert alert-danger">STORE_ID が未設定です</div>'; 
    return; 
  }

  const esc = (s)=>String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  el.innerHTML = '<div class="placeholder-glow"><div class="placeholder col-12" style="height: 120px;"></div></div>';
  topEl.innerHTML = '<div class="placeholder-glow"><div class="placeholder col-12" style="height: 120px;"></div></div>';

  fetch(`/api/stores/${encodeURIComponent(STORE_ID)}/dashboard`)
    .then(r=>r.json())
    .then(d=>{
      const m = d.metrics||{};
      const roi   = (m.estimated_roi!=null)? `<li>概算ROI <strong>${m.estimated_roi}x</strong></li>`: '';
      const sales = (m.estimated_sales_jpy!=null)? `<li>売上推定 <strong>¥${Number(m.estimated_sales_jpy).toLocaleString()}</strong></li>`: '';
      el.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">効果測定（${esc(d.period||'--')}）</h5>
            <ul class="list-unstyled">
              <li>送客 <strong>${esc(m.sent_customers)}</strong></li>
              <li>予約 <strong>${esc(m.bookings)}</strong> / 来店率 <strong>${esc(m.visit_rate)}%</strong></li>
              <li>動画再生 <strong>${esc(m.video_views)}</strong></li>
              ${sales}
              ${roi}
            </ul>
            <details class="mt-3">
              <summary class="btn btn-sm btn-outline-secondary">キャンペーン別</summary>
              <div class="table-responsive mt-2">
                <table class="table table-sm">
                  <thead>
                    <tr><th>施策</th><th>送客</th><th>再生</th><th>備考</th></tr>
                  </thead>
                  <tbody>
                    ${(d.campaigns||[]).map(c=>`<tr>
                      <td>${esc(c.name)}</td>
                      <td>${esc(c.sent)}</td>
                      <td>${esc(c.views)}</td>
                      <td>${esc(c.note||'')}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>`;
      
      const rows = (d.top_contributors||[]).slice(0, window.POLICY?.TOP_GUIDES_COUNT||3).map(c=>`<tr>
        <td>${esc(c.display_name||'ガイド')}</td>
        <td>${esc(c.sent)}</td>
        <td>${esc(c.bookings)}</td>
        <td>${esc(c.visit_rate)}%</td>
        <td>${esc(c.last_active)}</td>
      </tr>`).join('');
      
      topEl.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">TOP貢献ガイド</h5>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>ガイド</th>
                    <th>送客</th>
                    <th>予約</th>
                    <th>来店率</th>
                    <th>最終活動</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>`;
    })
    .catch(err=>{
      console.error('Failed to load store dashboard:', err);
      el.innerHTML = '<div class="alert alert-danger">読み込みに失敗しました</div>'; 
      topEl.innerHTML = ''; 
    });
})();
