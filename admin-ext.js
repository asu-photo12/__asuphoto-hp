/* ============================================================
   管理サイト拡張
   1) パスワード入力
   2) 写真アップロード（Asuphoto の透かし文字を自動で焼き込み）
   3) GitHub へ data.js と写真をまとめて公開
   ============================================================ */
(function () {
  'use strict';

  var DEFAULT_REPO = 'asu-photo12/__asuphoto-hp';
  var LS_TOKEN = 'asuphoto-gh-token';
  var LS_REPO = 'asuphoto-gh-repo';
  var SS_AUTH = 'asuphoto-admin-auth';

  var pending = {};      // './images/xxx.jpg' -> Blob（まだ公開していない写真）
  var previews = {};     // './images/xxx.jpg' -> objectURL（画面表示用）
  window.pendingUploads = pending;
  window.previewSrc = function (p) { return previews[p] || p; };

  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function repoName() { return (lsGet(LS_REPO) || DEFAULT_REPO).trim(); }
  function token() { return lsGet(LS_TOKEN).trim(); }

  /* ---------- 見た目（モーダル共通） ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.ax-overlay{position:fixed;inset:0;background:rgba(250,249,246,.97);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}' +
    '.ax-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 28px;width:100%;max-width:440px;box-shadow:0 10px 40px rgba(0,0,0,.06)}' +
    '.ax-card h2{font-size:18px;margin-bottom:6px}' +
    '.ax-card p{font-size:13px;color:var(--stone);margin-bottom:14px;line-height:1.8}' +
    '.ax-card label{display:block;font-size:12px;font-weight:700;color:var(--stone);margin:14px 0 6px}' +
    '.ax-card input[type=password],.ax-card input[type=text]{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:8px;font-size:15px;font-family:inherit}' +
    '.ax-card input:focus{outline:none;border-color:var(--teal)}' +
    '.ax-row{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}' +
    '.ax-btn{border:0;border-radius:100px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--teal);color:#fff}' +
    '.ax-btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}' +
    '.ax-btn:disabled{opacity:.5;cursor:default}' +
    '.ax-msg{font-size:13px;margin-top:12px;min-height:18px;line-height:1.7}' +
    '.ax-msg.err{color:var(--danger)}.ax-msg.ok{color:var(--teal-deep)}' +
    '.ax-help{font-size:12px;color:var(--stone);background:var(--paper);border-radius:8px;padding:12px 14px;line-height:1.9;margin-top:6px}' +
    '.ax-help b{color:var(--ink)}' +
    '.ax-wide{max-width:560px}' +
    '.ax-upload{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}' +
    '.ax-upload .ax-file{font-size:12px}' +
    '.ax-upload small{font-size:11px;color:var(--stone)}' +
    '.ax-move{display:flex;gap:6px}' +
    '.ax-move button{border:1px solid var(--line);background:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px}' +
    '.ax-pending{font-size:11px;font-weight:700;color:var(--warn);margin-left:8px}' +
    '.ax-bulk{background:var(--paper);border:1.5px dashed var(--line);border-radius:10px;padding:16px;margin-bottom:16px}' +
    '.ax-bulk h3{font-size:14px;margin-bottom:8px}' +
    '.ax-bulk select{padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-family:inherit;font-size:13px;margin-right:8px}';
  document.head.appendChild(css);

  function overlay(inner, wide) {
    var o = document.createElement('div');
    o.className = 'ax-overlay';
    o.innerHTML = '<div class="ax-card' + (wide ? ' ax-wide' : '') + '">' + inner + '</div>';
    document.body.appendChild(o);
    return o;
  }

  /* ---------- パスワード ---------- */
  function hex2buf(h) {
    var a = new Uint8Array(h.length / 2);
    for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
    return a;
  }
  function buf2hex(b) {
    return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  async function derive(pw, saltHex, iter) {
    var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hex2buf(saltHex), iterations: iter }, key, 256);
    return buf2hex(bits);
  }

  async function requireLogin() {
    if (ssGet(SS_AUTH) === '1') return;
    if (typeof ADMIN_AUTH === 'undefined') return; // 設定ファイルが無い場合は通す
    var loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'none';
    await new Promise(function (resolve) {
      var o = overlay(
        '<h2>管理サイト ログイン</h2><p>パスワードを入力してください。</p>' +
        '<label>パスワード</label><input type="password" id="axPw" autocomplete="current-password">' +
        '<div class="ax-msg err" id="axMsg"></div>' +
        '<div class="ax-row"><button class="ax-btn" id="axGo">ログイン</button></div>');
      var pw = o.querySelector('#axPw'), msg = o.querySelector('#axMsg'), go = o.querySelector('#axGo');
      async function attempt() {
        go.disabled = true; msg.textContent = '';
        try {
          var h = await derive(pw.value, ADMIN_AUTH.salt, ADMIN_AUTH.iter);
          if (h === ADMIN_AUTH.hash) {
            ssSet(SS_AUTH, '1'); o.remove();
            if (loading) loading.style.display = 'flex';
            resolve();
            return;
          }
          msg.textContent = 'パスワードが違います';
        } catch (e) {
          msg.textContent = 'この環境ではログインできません（https のページで開いてください）';
        }
        go.disabled = false;
      }
      go.addEventListener('click', attempt);
      pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
      pw.focus();
    });
  }

  /* ---------- GitHub API ---------- */
  async function gh(path, opts) {
    opts = opts || {};
    var res = await fetch('https://api.github.com' + path, {
      method: opts.method || 'GET',
      headers: Object.assign({
        'Authorization': 'Bearer ' + token(),
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    });
    if (!res.ok) {
      var t = '';
      try { t = (await res.json()).message || ''; } catch (e) {}
      var err = new Error('GitHub ' + res.status + ' ' + t);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function explain(e) {
    if (e && e.status === 401) return 'トークンが正しくないか、期限切れです。「設定」で入れ直してください。';
    if (e && e.status === 403) return 'トークンの権限が足りません。Contents を「Read and write」にしてください。';
    if (e && e.status === 404) return 'リポジトリが見つかりません。リポジトリ名とトークンの対象リポジトリを確認してください。';
    return (e && e.message) || '不明なエラー';
  }

  async function commitFiles(files, message) {
    var repo = repoName();
    var info = await gh('/repos/' + repo);
    var branch = info.default_branch;
    var ref = await gh('/repos/' + repo + '/git/ref/heads/' + branch);
    var baseCommit = await gh('/repos/' + repo + '/git/commits/' + ref.object.sha);
    var tree = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var blob = await gh('/repos/' + repo + '/git/blobs', {
        method: 'POST',
        body: f.base64 ? { content: f.base64, encoding: 'base64' } : { content: f.text, encoding: 'utf-8' }
      });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    var newTree = await gh('/repos/' + repo + '/git/trees', { method: 'POST', body: { base_tree: baseCommit.tree.sha, tree: tree } });
    var commit = await gh('/repos/' + repo + '/git/commits', { method: 'POST', body: { message: message, tree: newTree.sha, parents: [ref.object.sha] } });
    await gh('/repos/' + repo + '/git/refs/heads/' + branch, { method: 'PATCH', body: { sha: commit.sha } });
    return commit;
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  /* 公開されている最新の data.js を読み込み、古いキャッシュで上書きしないようにする */
  async function refreshFromGitHub() {
    if (!token()) return;
    try {
      var res = await fetch('https://api.github.com/repos/' + repoName() + '/contents/data.js', {
        headers: { 'Authorization': 'Bearer ' + token(), 'Accept': 'application/vnd.github.raw' },
        cache: 'no-store'
      });
      if (!res.ok) return;
      var text = await res.text();
      var fresh = new Function(text + '\n;return DEFAULT_CONTENT;')();
      if (fresh && fresh.gallery) window.DEFAULT_CONTENT = fresh;
    } catch (e) { /* 失敗したら同梱の data.js を使う */ }
  }

  /* ---------- 写真処理（縮小 + 透かし） ---------- */
  async function processImage(file, withMark) {
    var bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    var s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    var W = Math.round(bmp.width * s), H = Math.round(bmp.height * s);
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0, W, H);
    if (withMark) {
      try { await document.fonts.load('500 100px Jost'); } catch (e) {}
      var TEXT = 'Asuphoto', TRACK = 0.28;
      var family = '"Jost","Zen Kaku Gothic New",sans-serif';
      var chars = TEXT.split('');
      var width = function (sz) {
        ctx.font = '500 ' + sz + 'px ' + family;
        var sum = 0;
        chars.forEach(function (ch) { sum += ctx.measureText(ch).width; });
        return sum + sz * TRACK * (chars.length - 1);
      };
      var size = Math.max(16, Math.round(100 * W * 0.34 / width(100)));
      var tw = width(size);
      var x = (W - tw) / 2, y = H * 0.945;
      ctx.font = '500 ' + size + 'px ' + family;
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = size * 0.08;
      ctx.shadowOffsetX = size * 0.03;
      ctx.shadowOffsetY = size * 0.04;
      ctx.fillStyle = 'rgba(255,255,255,0.59)';
      chars.forEach(function (ch) {
        ctx.fillText(ch, x, y);
        x += ctx.measureText(ch).width + size * TRACK;
      });
    }
    return new Promise(function (resolve) { c.toBlob(resolve, 'image/jpeg', 0.84); });
  }
  window.axProcessImage = processImage;

  function newPath() {
    return './images/up-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '.jpg';
  }
  async function addPending(file, withMark) {
    var blob = await processImage(file, withMark);
    var p = newPath();
    pending[p] = blob;
    previews[p] = URL.createObjectURL(blob);
    return p;
  }

  /* ギャラリーの1枚を差し替え（透かしあり） */
  window.axReplaceGallery = async function (i, input) {
    if (!input.files || !input.files[0]) return;
    input.disabled = true;
    try {
      var p = await addPending(input.files[0], true);
      content.gallery[i].photo = p;
      renderGalleryList();
    } catch (e) { alert('写真を読み込めませんでした'); console.error(e); }
    input.disabled = false;
  };

  /* ギャラリーにまとめて追加（透かしあり） */
  window.axBulkAdd = async function () {
    var sel = document.getElementById('axBulkCat');
    var inp = document.getElementById('axBulkFiles');
    var status = document.getElementById('axBulkMsg');
    if (!inp.files.length) { status.textContent = '写真を選んでください'; return; }
    var label = sel.value, key;
    if (label === '__new__') {
      label = (document.getElementById('axBulkNewCat').value || '').trim();
      if (!label) { status.textContent = '新しいカテゴリー名を入力してください'; return; }
      key = toKey(label);
    } else {
      var ex = content.gallery.filter(function (g) { return g.catLabel === label; })[0];
      key = ex ? ex.cat : toKey(label);
    }
    status.textContent = '処理中…';
    var at = -1;
    content.gallery.forEach(function (g, i) { if (g.catLabel === label) at = i; });
    var files = Array.prototype.slice.call(inp.files), added = [];
    for (var n = 0; n < files.length; n++) {
      status.textContent = '処理中… ' + (n + 1) + ' / ' + files.length;
      try {
        var p = await addPending(files[n], true);
        added.push({ cat: key, catLabel: label, photo: p, caption: '' });
      } catch (e) { console.error(e); }
    }
    if (at >= 0) Array.prototype.splice.apply(content.gallery, [at + 1, 0].concat(added));
    else content.gallery.push.apply(content.gallery, added);
    inp.value = '';
    status.textContent = added.length + '枚を追加しました。「公開する」を押すと反映されます。';
    renderGalleryList();
  };

  /* ヒーロー・プロフィール・カード用（透かしなし） */
  window.axUploadInto = async function (input, setter) {
    if (!input.files || !input.files[0]) return;
    input.disabled = true;
    try {
      var p = await addPending(input.files[0], false);
      setter(p, previews[p]);
    } catch (e) { alert('写真を読み込めませんでした'); console.error(e); }
    input.disabled = false;
  };

  window.axMoveGallery = function (i, d) {
    var j = i + d;
    if (j < 0 || j >= content.gallery.length) return;
    var t = content.gallery[i]; content.gallery[i] = content.gallery[j]; content.gallery[j] = t;
    renderGalleryList();
  };

  function catOptions() {
    var cats = [];
    content.gallery.forEach(function (g) { if (cats.indexOf(g.catLabel) < 0) cats.push(g.catLabel); });
    return cats.map(function (c) { return '<option value="' + escAttr(c) + '">' + escHtml(c) + '</option>'; }).join('') +
      '<option value="__new__">＋ 新しいカテゴリー…</option>';
  }
  window.axRefreshCats = function () {
    var sel = document.getElementById('axBulkCat');
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = catOptions();
    if (cur) sel.value = cur;
    if (sel.value !== cur) sel.selectedIndex = 0;
  };
  window.axBulkPanelHtml = function () {
    return '<div class="ax-bulk"><h3>写真をアップロードして追加（透かし文字「Asuphoto」が自動で入ります）</h3>' +
      '<div class="ax-upload"><select id="axBulkCat">' + catOptions() + '</select>' +
      '<input type="text" id="axBulkNewCat" placeholder="新しいカテゴリー名" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;display:none">' +
      '</div>' +
      '<div class="ax-upload"><input class="ax-file" type="file" id="axBulkFiles" accept="image/*" multiple>' +
      '<button class="ax-btn" type="button" onclick="axBulkAdd()">追加する</button></div>' +
      '<div class="ax-msg" id="axBulkMsg"></div>' +
      '<small style="font-size:11px;color:var(--stone)">追加先カテゴリーの最後に入ります。並び替えは各写真の「↑ ↓」で行えます。写真は長辺1600pxに縮小されます。</small></div>';
  };
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'axBulkCat') {
      document.getElementById('axBulkNewCat').style.display = e.target.value === '__new__' ? 'inline-block' : 'none';
    }
  });

  /* ---------- 公開 ---------- */
  function setStatus(text, cls) {
    var el = document.getElementById('statusMsg');
    if (!el) return;
    el.textContent = text;
    el.className = 'status-msg show ' + (cls || '');
  }

  window.axPublish = async function () {
    if (!token()) { openSettings('まず GitHub のトークンを設定してください。'); return; }
    var btn = document.getElementById('publishBtn');
    btn.disabled = true; var old = btn.textContent; btn.textContent = '公開中…';
    try {
      collectBrandForm(); collectHeroForm(); collectProfileForm(); collectSectionHeadingsForm(); collectContactForm();
      var json = JSON.stringify(content);
      var files = [{ path: 'data.js', text: buildDataJsText() }];
      var used = Object.keys(pending).filter(function (p) { return json.indexOf(p) >= 0; });
      for (var i = 0; i < used.length; i++) {
        files.push({ path: used[i].replace(/^\.\//, ''), base64: await blobToBase64(pending[used[i]]) });
      }
      await commitFiles(files, '管理サイトから更新（写真' + used.length + '枚）');
      used.forEach(function (p) { delete pending[p]; });
      setStatus('✓ 公開しました（反映まで1〜2分かかります）', 'ok');
      var banner = document.getElementById('exportBanner');
      banner.style.display = 'block';
      banner.innerHTML = '<p><strong>GitHub に公開しました。</strong> 1〜2分後にホームページへ反映されます。表示が変わらないときは、ページを再読み込みしてください。</p>';
    } catch (e) {
      console.error(e);
      setStatus('公開に失敗: ' + explain(e), 'err');
    }
    btn.disabled = false; btn.textContent = old;
  };

  /* ---------- 設定（トークン・パスワード変更） ---------- */
  function openSettings(note) {
    var o = overlay(
      '<h2>設定</h2>' + (note ? '<p style="color:var(--danger)">' + note + '</p>' : '') +
      '<label>GitHub リポジトリ</label><input type="text" id="axRepo" value="' + escAttr(repoName()) + '">' +
      '<label>GitHub トークン（このブラウザにだけ保存されます）</label><input type="password" id="axTok" value="' + escAttr(token()) + '" autocomplete="off">' +
      '<div class="ax-help"><b>トークンの作り方（最初の1回だけ）</b><br>' +
      '1. GitHub の <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Fine-grained token 作成ページ</a> を開く<br>' +
      '2. Repository access →「Only select repositories」→ <b>' + escHtml(DEFAULT_REPO) + '</b> を選ぶ<br>' +
      '3. Permissions → Repository permissions →「Contents」を <b>Read and write</b> にする<br>' +
      '4. 「Generate token」で作られた文字列をここに貼り付ける</div>' +
      '<div class="ax-row"><button class="ax-btn" id="axSave">保存して接続テスト</button></div>' +
      '<div class="ax-msg" id="axSMsg"></div>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:22px 0 4px">' +
      '<label>パスワードを変更する</label>' +
      '<input type="password" id="axNew1" placeholder="新しいパスワード（8文字以上）" autocomplete="new-password">' +
      '<input type="password" id="axNew2" placeholder="もう一度" style="margin-top:8px" autocomplete="new-password">' +
      '<div class="ax-row"><button class="ax-btn ghost" id="axPwBtn">パスワードを変更（GitHub に反映）</button></div>' +
      '<div class="ax-msg" id="axPMsg"></div>' +
      '<div class="ax-row"><button class="ax-btn ghost" id="axClose">閉じる</button><button class="ax-btn ghost" id="axLogout">ログアウト</button></div>', true);
    var $ = function (s) { return o.querySelector(s); };
    $('#axClose').onclick = function () { o.remove(); };
    $('#axLogout').onclick = function () { ssSet(SS_AUTH, ''); location.reload(); };
    $('#axSave').onclick = async function () {
      var m = $('#axSMsg'); m.className = 'ax-msg'; m.textContent = '確認中…';
      lsSet(LS_REPO, $('#axRepo').value.trim()); lsSet(LS_TOKEN, $('#axTok').value.trim());
      try {
        var info = await gh('/repos/' + repoName());
        if (info.permissions && info.permissions.push === false) throw Object.assign(new Error('x'), { status: 403 });
        m.className = 'ax-msg ok'; m.textContent = '✓ 接続できました（' + info.full_name + '）';
      } catch (e) { m.className = 'ax-msg err'; m.textContent = explain(e); }
    };
    $('#axPwBtn').onclick = async function () {
      var m = $('#axPMsg'); m.className = 'ax-msg err';
      var a = $('#axNew1').value, b = $('#axNew2').value;
      if (a.length < 8) { m.textContent = '8文字以上にしてください'; return; }
      if (a !== b) { m.textContent = '2つが一致しません'; return; }
      if (!token()) { m.textContent = '先にトークンを保存してください'; return; }
      m.className = 'ax-msg'; m.textContent = '変更中…';
      try {
        var salt = buf2hex(crypto.getRandomValues(new Uint8Array(16)));
        var iter = 100000;
        var hash = await derive(a, salt, iter);
        await commitFiles([{ path: 'admin-auth.js', text: 'var ADMIN_AUTH={salt:"' + salt + '",hash:"' + hash + '",iter:' + iter + '};\n' }], '管理サイトのパスワードを変更');
        m.className = 'ax-msg ok'; m.textContent = '✓ 変更しました（反映まで1〜2分。それまでは前のパスワードです）';
      } catch (e) { m.className = 'ax-msg err'; m.textContent = explain(e); }
    };
  }
  window.axOpenSettings = openSettings;

  /* ---------- 画面への組み込み ---------- */
  function wireUi() {
    // 上部ボタン
    var save = document.getElementById('saveBtn');
    if (save) {
      var pub = document.createElement('button');
      pub.className = 'btn btn-primary'; pub.id = 'publishBtn'; pub.textContent = 'GitHubに公開する';
      pub.addEventListener('click', window.axPublish);
      save.parentNode.insertBefore(pub, save);
      if (!window.storage) save.style.display = 'none';
    }
    // 設定ボタン
    var foot = document.querySelector('.side-foot');
    if (foot) {
      var b = document.createElement('a');
      b.href = '#'; b.textContent = '設定（トークン・パスワード）';
      b.style.cssText = 'display:block;margin-top:14px;font-size:12px;color:rgba(255,255,255,.7);text-decoration:underline;text-align:center';
      b.addEventListener('click', function (e) { e.preventDefault(); openSettings(); });
      foot.appendChild(b);
    }
    // ギャラリー：まとめてアップロード
    var list = document.getElementById('gallery-list');
    if (list) {
      var box = document.createElement('div');
      box.id = 'gallery-bulk';
      box.innerHTML = axBulkPanelHtml();
      list.parentNode.insertBefore(box, list);
    }
    // ヒーロー / プロフィール
    [['hero-photo', 'hero-photo-preview'], ['profile-photo', 'profile-photo-preview']].forEach(function (pair) {
      var input = document.getElementById(pair[0]);
      if (!input) return;
      var wrap = document.createElement('div');
      wrap.className = 'ax-upload';
      wrap.innerHTML = '<input class="ax-file" type="file" accept="image/*"><small>写真をアップロード（透かしなし）</small>';
      input.parentNode.insertBefore(wrap, input);
      wrap.querySelector('input').addEventListener('change', function () {
        axUploadInto(this, function (p, url) {
          input.value = p;
          input.dispatchEvent(new Event('input'));
          var img = document.getElementById(pair[1]); if (img) img.src = url;
        });
      });
    });
  }

  /* init() の前に呼ばれる */
  window.axBeforeInit = async function () {
    await requireLogin();
    await refreshFromGitHub();
  };
  window.axAfterInit = wireUi;
})();
