(function(){
  const incomeEl = document.getElementById('guide-income-card');
  const rankEl   = document.getElementById('guide-rank-card');
  const rankTableEl = document.getElementById('guide-rank-table');
  
  if(!incomeEl || !rankEl) return;
  if(!window.FEATURES?.ENABLE_GUIDE_RANKING) return;

  const GUIDE_ID = window.GUIDE_ID || document.body.dataset.guideId;
  if(!GUIDE_ID){ 
    incomeEl.innerHTML = '<div class="alert alert-danger">GUIDE_ID が未設定です</div>'; 
    return; 
  }

  incomeEl.innerHTML = '<div class="placeholder-glow"><div class="placeholder col-12" style="height: 100px;"></div></div>';
  rankEl.innerHTML   = '<div class="placeholder-glow"><div class="placeholder col-12" style="height: 100px;"></div></div>';
  if(rankTableEl) rankTableEl.innerHTML = '<div class="placeholder-glow"><div class="placeholder col-12" style="height: 100px;"></div></div>';

  fetch(`/api/guides/${encodeURIComponent(GUIDE_ID)}/dashboard`)
    .then(r=>r.json())
    .then(d=>{
      const s = d.summary||{};
      incomeEl.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">今月の配当</h5>
            <div class="display-4">¥${Number(s.payout_month_total||0).toLocaleString()}</div>
            <details class="mt-3">
              <summary class="btn btn-sm btn-outline-secondary">内訳</summary>
              <ul class="list-unstyled mt-2">
                ${(d.payouts||[]).map(p=>`<li>${p.date} ${p.store}：¥${Number(p.amount).toLocaleString()}</li>`).join('')}
              </ul>
            </details>
          </div>
        </div>`;
      
      rankEl.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">ランク：${s.current_rank||'--'}</h5>
            <p>次のランク（${s.next_rank||'--'}）まで <strong>${s.points_to_next||0}</strong> pt</p>
            <div class="progress" style="height: 25px;">
              <div class="progress-bar" role="progressbar" 
                style="width: ${Math.min(100, ((s.rank_score||0) / ((s.rank_score||0) + (s.points_to_next||1))) * 100)}%"
                aria-valuenow="${s.rank_score||0}" 
                aria-valuemin="0" 
                aria-valuemax="${(s.rank_score||0) + (s.points_to_next||1)}">
                ${s.rank_score||0} pt
              </div>
            </div>
          </div>
        </div>`;
    })
    .catch(err=>{
      console.error('Failed to load guide dashboard:', err);
      incomeEl.innerHTML = '<div class="alert alert-danger">読み込みに失敗しました</div>'; 
      rankEl.innerHTML=''; 
    });

  if(rankTableEl) {
    fetch('/api/admin/ranks')
      .then(r=>r.json())
      .then(rows=>{
        const head = '<thead><tr><th>ランク</th><th>昇格に必要なポイント</th><th>配当ボーナス</th></tr></thead>';
        const body = '<tbody>' + rows.map(r=>`<tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.minScore}</td>
          <td>+${Math.round(r.bonusRate*100)}%</td>
        </tr>`).join('') + '</tbody>';
        rankTableEl.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">ランク早見表</h5>
              <div class="table-responsive">
                <table class="table table-sm">${head}${body}</table>
              </div>
            </div>
          </div>`;
      })
      .catch(err=>{
        console.error('Failed to load rank table:', err);
        rankTableEl.innerHTML = '<div class="alert alert-danger">ランク表を取得できませんでした</div>'; 
      });
  }
})();
