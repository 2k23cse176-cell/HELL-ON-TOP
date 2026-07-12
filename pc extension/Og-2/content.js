// content.js — HELL ON TOP v3.1.0 — Purple Glow Particle Theme

(function () {
    if (document.getElementById('hell-on-top-root')) return;

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);

        // license integration: validate and heartbeat
        try{
            const key = localStorage.getItem('license_key');
            if(key){
                window.licenseClient && window.licenseClient.validate(key).then(async r=>{
                    if(!r.valid) console.warn('License invalid'); else {
                        const claim = await (window.licenseClient.claim ? window.licenseClient.claim(key) : {ok:false});
                        if(claim && claim.ok) setInterval(()=>{ window.licenseClient.report(key,60); },60*1000);
                        else console.warn('Claim failed', claim);
                    }
                });
            } else { const k = prompt('Enter license key for Hell extension'); if(k){ localStorage.setItem('license_key',k); location.reload(); } }
        }catch(e){console.error(e)}

    const state = {
        enabled: true, expanded: false, preset: 'HELL ON TOP', activeTab: 'main',
        gain: 1.0, eqEnabled: true, compressorEnabled: true,
        threshold: 15, ratio: 12.0, knee: 45,
        eqBands: [6, 8, 10, 4, 2, 0, 2, 4, 6, 8],
        lowGain: 6, midGain: 3, highGain: 5, presenceGain: 8,
        masterGain: 0.6, godGain: 0.4, hyperBoost: 0.3, extremePush: 0.2,
        saturation: 0.5, ultraSat: 0.3, exciter: 0.4, voiceDensity: 0.6,
        airBoost: 0.5, subBoost: 0.7, warmth: 0.4, bite: 0.6, bodyBoost: 0.5, transientPunch: 0.4,
        reverbAmount: 0.1, reverbDecay: 1.5
    };

    const PRESETS = {
        'HELL ON TOP': {
            gain: 1.0, threshold: 10, ratio: 8.0, knee: 40,
            masterGain: 0.5, godGain: 0.2, hyperBoost: 0.2, extremePush: 0.1,
            saturation: 0.4, ultraSat: 0.2, exciter: 0.3, voiceDensity: 0.6,
            airBoost: 0.4, subBoost: 0.5, warmth: 0.3, bite: 0.4, bodyBoost: 0.4, transientPunch: 0.4,
            lowGain: 4, midGain: 2, highGain: 3, presenceGain: 5, eqEnabled: true,
            eqBands: [4, 5, 6, 3, 1, 0, 1, 3, 4, 5]
        },
        'INFERNO': {
            gain: 1.0, threshold: 30, ratio: 15.0, knee: 60,
            masterGain: 0.9, godGain: 0.8, hyperBoost: 0.7, extremePush: 0.6,
            saturation: 0.9, ultraSat: 0.8, exciter: 0.8, voiceDensity: 1.0,
            airBoost: 0.9, subBoost: 0.9, warmth: 0.8, bite: 0.9, bodyBoost: 0.8, transientPunch: 0.9,
            lowGain: 10, midGain: 8, highGain: 9, presenceGain: 12, eqEnabled: true,
            eqBands: [10, 11, 12, 9, 7, 6, 7, 9, 11, 12]
        },
        'APOCALYPSE': {
            gain: 1.0, threshold: 40, ratio: 20.0, knee: 60,
            masterGain: 1.0, godGain: 1.0, hyperBoost: 1.0, extremePush: 1.0,
            saturation: 1.0, ultraSat: 1.0, exciter: 1.0, voiceDensity: 1.0,
            airBoost: 1.0, subBoost: 1.0, warmth: 1.0, bite: 1.0, bodyBoost: 1.0, transientPunch: 1.0,
            lowGain: 12, midGain: 12, highGain: 12, presenceGain: 12, eqEnabled: true,
            eqBands: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12]
        }
    };

    const EQ_FREQS = ['32','63','125','250','500','1k','2k','4k','8k','16k'];

    function pushState() {
        window.dispatchEvent(new CustomEvent('__blakeCord_update', { detail: { ...state } }));
        try { localStorage.setItem('hellOnTopState', JSON.stringify(state)); } catch (_) {}
    }

    try {
        const raw = localStorage.getItem('hellOnTopState');
        if (raw) Object.assign(state, JSON.parse(raw));
    } catch (_) {}

    function initUI() {
        if (!document.body) return setTimeout(initUI, 100);

        // ── Shadow DOM root ───────────────────────────────────────────────────────
        const host = document.createElement('div');
        host.id = 'hell-on-top-root';
        host.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;';
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });

    // Background image URL fetching directly from extension
    const bgUrl = chrome.runtime.getURL('icons/hell_on_top.jpg');

    // ── Purple Glow CSS ──────────────────────────────────────────────────────
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        :host { all: initial; font-family: 'Segoe UI', system-ui, sans-serif; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes neonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes purpleGlow  { 0%,100%{text-shadow:0 0 6px var(--c),0 0 12px var(--c)} 50%{text-shadow:0 0 15px var(--c),0 0 30px var(--c),0 0 45px #ff2200} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatParticles { 0% { background-position: 0px 0px; } 100% { background-position: 40px 40px; } }

        /* Pill ───────────────────────────────────── */
        .pill {
            display:flex; align-items:center; gap:10px;
            background:rgba(0,0,0,0.92); border:1px solid #ff220066;
            border-top:none; border-radius:0 0 16px 16px;
            padding:7px 18px; cursor:pointer; user-select:none;
            backdrop-filter:blur(20px);
            box-shadow:0 4px 24px rgba(200,30,0,0.2), 0 0 0 1px rgba(200,30,0,0.1);
            transition:all .2s;
        }
        .pill:hover { box-shadow:0 4px 32px #ff220088, inset 0 0 20px #ff22001a; border-color:#ff2200cc; }
        .pill-dot {
            width:8px; height:8px; border-radius:50%;
            background:#ff2200; box-shadow:0 0 8px #ff2200, 0 0 16px #ff4422;
            animation:neonPulse 1.5s ease-in-out infinite;
        }
        .pill-dot.off { background:#333; box-shadow:none; animation:none; }
        .pill-name { color:#ffaa88; font-size:13px; font-weight:800; letter-spacing:2px; text-transform:uppercase; text-shadow:0 0 5px #ff220044; }
        .pill-preset {
            color:#ff442288; font-size:10px; letter-spacing:1px;
            border-left:1px solid #ff442222; padding-left:10px;
            text-transform:uppercase;
        }
        .pill-arrow { color:#ff2200aa; font-size:9px; }

        /* Panel ──────────────────────────────────── */
        .panel {
            width:340px; max-height:95vh;
            background: linear-gradient(rgba(10,0,0,0.75), rgba(20,0,0,0.88)), url('${bgUrl}');
            background-size: cover; background-position: center;
            border:1px solid #ff220055; border-top:none;
            border-radius:0 0 20px 20px;
            box-shadow:0 0 40px rgba(200,30,0,0.3), 0 0 0 1px rgba(200,30,0,0.15), 0 20px 60px rgba(0,0,0,.9);
            display:flex; flex-direction:column; overflow:hidden;
            animation:slideDown .2s ease-out;
            backdrop-filter:blur(30px);
            position:relative;
        }

        /* Particle glow effect background overlay */
        .panel::before {
            content:''; position:absolute; inset:0; pointer-events:none;
            background-image: radial-gradient(rgba(200,30,0,0.15) 1px, transparent 0), radial-gradient(rgba(255, 0, 255, 0.1) 1px, transparent 0);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
            animation: floatParticles 8s linear infinite;
            opacity: 0.6;
            z-index: 0;
        }

        /* Scanline overlay */
        .panel::after {
            content:''; position:absolute; inset:0; pointer-events:none;
            background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(191,0,255,.015) 3px);
            border-radius:0 0 20px 20px;
            z-index: 1;
        }

        /* Header */
        .hdr {
            padding:14px 14px 0;
            background:linear-gradient(180deg,rgba(191,0,255,.12),transparent);
            border-bottom:1px solid #ff220033;
            position: relative; z-index: 2;
        }
        .hdr-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .hdr-left { display:flex; align-items:center; gap:10px; }
        .hdr-icon { font-size:22px; filter:drop-shadow(0 0 8px #ff2200); }
        .hdr-title {
            font-size:17px; font-weight:900; letter-spacing:3px;
            color:#ffaa88; --c:#ff2200; animation:purpleGlow 2s ease-in-out infinite;
            text-transform:uppercase;
        }
        .hdr-sub { color:#ff442244; font-size:9px; letter-spacing:1px; margin-top:2px; text-transform:uppercase; }
        .hdr-btns { display:flex; gap:8px; }
        .hdr-btn {
            background:none; border:1px solid #ff442218; border-radius:6px;
            color:#ff442255; font-size:12px; padding:3px 7px; cursor:pointer;
            transition:all .15s;
        }
        .hdr-btn:hover { border-color:#ff220088; color:#ffaa88; box-shadow:0 0 8px #ff220066; }

        /* Main toggle */
        .main-tog {
            display:flex; align-items:center; justify-content:space-between;
            padding:10px 0 10px;
        }
        .tog-label { color:#fff; font-size:13px; font-weight:700; letter-spacing:.5px; }
        .tog-sub { color:#ff442255; font-size:9px; margin-top:2px; letter-spacing:.5px; }

        /* Toggle switch */
        .sw { position:relative; width:44px; height:24px; flex-shrink:0; }
        .sw input { opacity:0; width:0; height:0; }
        .sw-track {
            position:absolute; inset:0; background:#ff442214;
            border-radius:12px; cursor:pointer; transition:background .2s;
            border:1px solid #ff442222;
        }
        .sw-track::before {
            content:''; position:absolute; width:18px; height:18px;
            border-radius:50%; background:#fff; left:2px; top:2px;
            transition:transform .2s, box-shadow .2s;
        }
        .sw input:checked + .sw-track { background:#ff220033; border-color:#ff2200; }
        .sw input:checked + .sw-track::before { transform:translateX(20px); background:#ffaa88; box-shadow:0 0 10px #ff2200, 0 0 20px #ff4422; }

        /* Tabs */
        .tabs {
            display:flex; border-top:1px solid #ff442211; margin-top:4px;
            background:rgba(0,0,0,.4);
        }
        .tab {
            flex:1; padding:10px 2px; text-align:center;
            color:#ff442244; font-size:9.5px; font-weight:700; letter-spacing:1px;
            cursor:pointer; border:none; background:none;
            border-bottom:2px solid transparent;
            transition:all .15s; text-transform:uppercase;
        }
        .tab:hover { color:#ff442288; }
        .tab.on { color:#ffaa88; border-bottom-color:#ff2200; text-shadow:0 0 10px #ff2200; }

        /* Body */
        .body {
            overflow-y:auto; padding:12px;
            display:flex; flex-direction:column; gap:10px;
            scrollbar-width:thin; scrollbar-color:#ff220033 transparent;
            position: relative; z-index: 2;
        }
        .body::-webkit-scrollbar { width:3px; }
        .body::-webkit-scrollbar-thumb { background:#ff220044; border-radius:3px; }

        /* Cards */
        .card {
            background:rgba(0, 0, 0, 0.6);
            border:1px solid rgba(200,30,0,0.25);
            border-radius:14px; padding:14px;
            display:flex; flex-direction:column; gap:10px;
            position:relative; overflow:hidden;
            backdrop-filter: blur(5px);
        }
        .card::before {
            content:''; position:absolute; top:0; left:0; right:0;
            height:1px; background:linear-gradient(90deg,transparent,var(--glow,#ff220055),transparent);
        }
        .card-title {
            font-size:10px; font-weight:800; letter-spacing:2.5px;
            text-transform:uppercase; display:flex; align-items:center; gap:6px;
        }
        .card-hint { color:#ff442233; font-size:9px; letter-spacing:.3px; }

        /* Presets grid */
        .presets { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .preset-btn {
            padding:10px 4px; border-radius:8px;
            background:rgba(0,0,0,.5); border:1px solid rgba(200,30,0,0.2);
            color:#ff442266; font-size:10px; font-weight:800; letter-spacing:1px;
            cursor:pointer; text-align:center; transition:all .15s;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
            text-transform:uppercase;
        }
        .preset-btn:hover { background:rgba(191,0,255,.1); border-color:#ff220066; color:#ffaa88; box-shadow:0 0 8px rgba(200,30,0,0.3); }
        .preset-btn.on {
            background:linear-gradient(135deg,rgba(200,30,0,0.35),rgba(255,60,0,0.12));
            border-color:#ff2200; color:#fff;
            box-shadow:0 0 14px rgba(200,30,0,0.5), inset 0 0 10px rgba(255,60,0,0.12);
            text-shadow: 0 0 5px #fff;
        }

        /* Sliders */
        .row { display:flex; flex-direction:column; gap:5px; }
        .row-hdr { display:flex; justify-content:space-between; align-items:center; }
        .row-lbl { font-size:10px; color:#ff442288; letter-spacing:.5px; }
        .row-val { font-size:11px; font-weight:800; letter-spacing:.5px; }

        input[type=range] {
            -webkit-appearance:none; appearance:none;
            width:100%; height:4px; border-radius:2px;
            background:rgba(255,255,255,.08); outline:none; cursor:pointer;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance:none; appearance:none;
            width:16px; height:16px; border-radius:50%;
            background:var(--thumb,#ff2200);
            box-shadow:0 0 8px var(--thumb,#ff2200), 0 0 15px rgba(200,30,0,0.5);
            cursor:pointer; transition:transform .1s;
        }
        input[type=range]:active::-webkit-slider-thumb { transform:scale(1.25); }

        .c-purple { color:#ff2200; --thumb:#ff2200; --glow:#ff220066; }
        .c-magenta { color:#ff4422; --thumb:#ff4422; --glow:#ff442266; }
        .c-violet { color:#cc1100; --thumb:#cc1100; --glow:#cc110066; }
        .c-lavender { color:#ffaa88; --thumb:#ffaa88; --glow:#ffaa8844; }

        /* EQ bands */
        .eq-bands { display:flex; justify-content:space-around; padding:6px 0; }
        .eq-band  { display:flex; flex-direction:column; align-items:center; gap:6px; }
        .eq-wrap  { width:20px; height:90px; display:flex; align-items:center; justify-content:center; }
        input[type=range].eq-v {
            -webkit-appearance:none; appearance:none;
            width:80px; height:4px; border-radius:2px;
            transform:rotate(-90deg); background:rgba(255,255,255,.08);
            cursor:pointer; outline:none;
        }
        input[type=range].eq-v::-webkit-slider-thumb {
            -webkit-appearance:none; appearance:none;
            width:14px; height:14px; border-radius:50%;
            background:#ff2200; box-shadow:0 0 6px #ff2200;
            cursor:pointer;
        }
        .eq-lbl { color:#ff442233; font-size:7.5px; }

        /* Toggle row */
        .tog-row { display:flex; align-items:center; justify-content:space-between; }

        /* Para band */
        .para-band { display:flex; align-items:center; gap:8px; }
        .para-lbl  { font-size:10px; font-weight:700; min-width:90px; }
        .para-val  { font-size:10px; font-weight:800; min-width:40px; text-align:right; }

        /* Level meter */
        .meter { height:8px; border-radius:4px; background:rgba(255,255,255,.05); overflow:hidden; border:1px solid rgba(191,0,255,.1); }
        .meter-fill { height:100%; border-radius:4px; width:0; transition:width .07s; background:linear-gradient(90deg,#ff2200,#ff4422,#ff4422); box-shadow: 0 0 10px #ff4422; }

        /* Action buttons */
        .action-btn {
            padding:9px; border-radius:10px; font-size:10px; font-weight:800;
            letter-spacing:1.5px; text-transform:uppercase; cursor:pointer;
            transition:all .15s; border:1px solid;
        }
        .action-btn.ghost { background:transparent; border-color:rgba(255,255,255,.12); color:#ff442255; }
        .action-btn.ghost:hover { border-color:#ff220066; color:#ffaa88; box-shadow:0 0 10px rgba(191,0,255,.2); }
    `;
    shadow.appendChild(styleEl);

    // ── Pill ──────────────────────────────────────────────────────────────────
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.innerHTML = `<div class="pill-dot" id="bc-dot"></div>
        <span class="pill-name">HELL ON TOP</span>
        <span class="pill-preset" id="bc-pill-preset">${state.preset}</span>
        <span class="pill-arrow">▼</span>`;
    shadow.appendChild(pill);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.display = 'none';
    shadow.appendChild(panel);

    // ── Build panel HTML ──────────────────────────────────────────────────────
    function render() {
        panel.innerHTML = `
            <div class="hdr">
                <div class="hdr-top">
                    <div class="hdr-left">
                        <span class="hdr-icon">👑</span>
                        <div>
                            <div class="hdr-title">HELL ON TOP</div>
                            <div class="hdr-sub" id="bc-sub">${state.enabled ? 'EMPIRE LIVE · OVERLOAD' : 'MUTED'}</div>
                        </div>
                    </div>
                    <div class="hdr-btns">
                        <button class="hdr-btn" id="bc-min">—</button>
                        <button class="hdr-btn" id="bc-cls">✕</button>
                    </div>
                </div>
                <div class="main-tog">
                    <div>
                        <div class="tog-label">Hell Amplification</div>
                        <div class="tog-sub">Demonic-tier voice engine active</div>
                    </div>
                    <label class="sw"><input type="checkbox" id="bc-en" ${state.enabled ? 'checked' : ''}><span class="sw-track"></span></label>
                </div>
                <div class="tabs">
                    ${['main','power','eq & tone'].map(t => `<button class="tab${state.activeTab===t?' on':''}" data-tab="${t}">${t.toUpperCase()}</button>`).join('')}
                </div>
            </div>
            <div class="body">
                ${tabMain()}${tabPower()}${tabEQTone()}
            </div>`;
        bind();
    }

    const pct = (v, scale=100) => Math.round((v||0) * scale);

    function sliderRow(id, label, colorCls, val, min=0, max=100, step=1) {
        return `<div class="row">
            <div class="row-hdr">
                <span class="row-lbl">${label}</span>
                <span class="row-val ${colorCls}" id="v-${id}">${Math.round(val)}%</span>
            </div>
            <input type="range" class="${colorCls}" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${Math.round(val)}">
        </div>`;
    }

    function tabMain() {
        return `<div class="tab-pane" id="tp-main" style="display:${state.activeTab==='main'?'flex':'none'};flex-direction:column;gap:10px;">
            <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,.3);padding:0 2px;">SELECT HELL MODE</div>
            <div class="presets">${Object.keys(PRESETS).map(p=>`<div class="preset-btn${state.preset===p?' on':''}" data-p="${p}">${p}</div>`).join('')}</div>

            <div class="card" style="--glow:#ff220066">
                <div class="card-title c-purple">🎚 CORE INPUT LEVEL</div>
                <div class="card-hint">Pre-amplifier floor settings</div>
                ${sliderRow('gain','Gain Stage Master','c-purple',pct(state.gain))}
                <div class="meter"><div class="meter-fill" id="bc-meter"></div></div>
            </div>
            <div class="card" style="--glow:#ff442244">
                <div class="card-title c-magenta">📉 DYNAMICS COMPRESSOR</div>
                <div class="tog-row">
                    <span class="row-lbl" style="color:#fff;font-size:11px;">Enable Dynamic Squeeze</span>
                    <label class="sw"><input type="checkbox" id="bc-comp" ${state.compressorEnabled?'checked':''}><span class="sw-track"></span></label>
                </div>
                <div id="bc-comp-body" style="display:${state.compressorEnabled?'flex':'none'};flex-direction:column;gap:10px;">
                    ${sliderRow('threshold','Threshold Level','c-magenta',((state.threshold+40)/80*100).toFixed(0),-40,40)}
                    ${sliderRow('ratio','Squeeze Ratio','c-magenta',(state.ratio/20*100).toFixed(0),1,20,0.5)}
                    ${sliderRow('knee','Hardness Knee','c-magenta',(state.knee/60*100).toFixed(0),0,60)}
                </div>
            </div>
        </div>`;
    }

    function tabPower() {
        return `<div class="tab-pane" id="tp-power" style="display:${state.activeTab==='power'?'flex':'none'};flex-direction:column;gap:10px;">
            <div class="card" style="--glow:#ff220066">
                <div class="card-title c-violet">⚡ QUAD-GAIN HELL STACK</div>
                <div class="card-hint">Four-stage demonic amplification engine</div>
                ${sliderRow('masterGain','Hell Stage 1','c-purple',pct(state.masterGain))}
                ${sliderRow('godGain','Hell Stage 2 (God Mode)','c-magenta',pct(state.godGain))}
                ${sliderRow('hyperBoost','Hell Stage 3 (Hyper)','c-violet',pct(state.hyperBoost))}
                ${sliderRow('extremePush','Hell Stage 4 (DECIMATOR)','c-lavender',pct(state.extremePush))}
            </div>
            <div class="card" style="--glow:#ff442266">
                <div class="card-title c-magenta">🔥 HARMONIC DENSITY & NOISE FLOOR</div>
                <div class="card-hint">Saturate waves and lock density for extreme presence</div>
                ${sliderRow('saturation','Wave Saturation','c-purple',pct(state.saturation))}
                ${sliderRow('ultraSat','Asymmetrical Peak Clip','c-magenta',pct(state.ultraSat))}
                ${sliderRow('exciter','Voice Density Exciter','c-violet',pct(state.exciter))}
                ${sliderRow('voiceDensity','Noise Density Factor','c-lavender',pct(state.voiceDensity))}
            </div>
        </div>`;
    }

    function tabEQTone() {
        return `<div class="tab-pane" id="tp-eq & tone" style="display:${state.activeTab==='eq & tone'?'flex':'none'};flex-direction:column;gap:10px;">
            <div class="card" style="--glow:#ff220044">
                <div class="card-title c-purple">📊 10-BAND RE-EQUALIZER</div>
                <div class="tog-row">
                    <span class="row-lbl" style="color:#fff;font-size:11px;">Active Matrix</span>
                    <label class="sw"><input type="checkbox" id="bc-eq-en" ${state.eqEnabled?'checked':''}><span class="sw-track"></span></label>
                </div>
                <div id="bc-eq-body" style="display:${state.eqEnabled?'flex':'none'}">
                    <div class="eq-bands">
                        ${EQ_FREQS.map((f,i)=>`<div class="eq-band">
                            <div class="eq-wrap"><input type="range" class="eq-v" data-band="${i}" min="-12" max="12" step="1" value="${state.eqBands[i]||0}"></div>
                            <span class="eq-lbl">${f}</span>
                        </div>`).join('')}
                    </div>
                </div>
                <div id="bc-eq-off" style="display:${state.eqEnabled?'none':'block'};text-align:center;color:rgba(255,255,255,.15);font-size:10px;padding:8px 0">Enable to engage graphic sliders</div>
            </div>
            <div class="card" style="--glow:#ff442244">
                <div class="card-title c-magenta">📈 PEAK MATRIX PARAMETRIC CONTROLS</div>
                ${['lowGain','midGain','highGain','presenceGain'].map((k,i) => {
                    const labels = ['Low Weights (120Hz)','Mids Core (1kHz)','Highs Sheen (6kHz)','Presence (3.5kHz)'];
                    const cols = ['c-purple','c-magenta','c-violet','c-lavender'];
                    const v = state[k]||0;
                    return `<div class="para-band">
                        <span class="para-lbl ${cols[i]}">${labels[i]}</span>
                        <input type="range" class="${cols[i]}" data-k="${k}" min="-12" max="12" step="0.5" value="${v}" style="flex:1">
                        <span class="para-val ${cols[i]}" id="v-${k}">${v>=0?'+':''}${Number(v).toFixed(1)}dB</span>
                    </div>`;
                }).join('')}
                <button class="action-btn ghost" id="bc-flat">⊖ FLAT MATRIX</button>
            </div>
        </div>`;
    }

    // ── Event binding ─────────────────────────────────────────────────────────
    function bind() {
        const $ = id => shadow.getElementById(id);
        const $$ = sel => shadow.querySelectorAll(sel);

        $('bc-min').onclick = $('bc-cls').onclick = close;

        $('bc-en').onchange = function() {
            state.enabled = this.checked;
            $('bc-sub').textContent = state.enabled ? 'EMPIRE LIVE · OVERLOAD' : 'MUTED';
            const dot = shadow.querySelector('.pill-dot');
            if (dot) dot.className = 'pill-dot' + (state.enabled ? '' : ' off');
            pushState();
        };

        $$('.tab').forEach(t => t.onclick = () => {
            state.activeTab = t.dataset.tab;
            $$('.tab').forEach(x => x.classList.remove('on'));
            t.classList.add('on');
            ['main','power','eq & tone'].forEach(name => {
                const el = $('tp-' + name);
                if (el) el.style.display = state.activeTab === name ? 'flex' : 'none';
            });
        });

        $$('.preset-btn').forEach(el => el.onclick = () => {
            const cfg = PRESETS[el.dataset.p];
            if (!cfg) return;
            state.preset = el.dataset.p;
            Object.assign(state, cfg);
            shadow.querySelector('#bc-pill-preset').textContent = state.preset;
            close(); open();
        });

        $$('[data-k]').forEach(el => el.oninput = () => {
            const k = el.dataset.k;
            const v = parseFloat(el.value);
            const valEl = $('v-' + k);
            if (k === 'threshold') {
                state.threshold = Math.round(v);
                if (valEl) valEl.textContent = Math.round(v) + ' dB';
            } else if (k === 'ratio') {
                state.ratio = parseFloat(v);
                if (valEl) valEl.textContent = Number(v).toFixed(1) + ':1';
            } else if (k === 'knee') {
                state.knee = Math.round(v);
                if (valEl) valEl.textContent = Math.round(v) + ' dB';
            } else if (k === 'lowGain' || k === 'midGain' || k === 'highGain' || k === 'presenceGain') {
                state[k] = parseFloat(v);
                if (valEl) valEl.textContent = (v >= 0 ? '+' : '') + Number(v).toFixed(1) + 'dB';
            } else {
                state[k] = v / 100;
                if (valEl) valEl.textContent = Math.round(v) + '%';
            }
            pushState();
        });

        const compCheck = $('bc-comp');
        if (compCheck) compCheck.onchange = function() {
            state.compressorEnabled = this.checked;
            const body = $('bc-comp-body');
            if (body) body.style.display = this.checked ? 'flex' : 'none';
            pushState();
        };

        const eqCheck = $('bc-eq-en');
        if (eqCheck) eqCheck.onchange = function() {
            state.eqEnabled = this.checked;
            const body = $('bc-eq-body'); const off = $('bc-eq-off');
            if (body) body.style.display = this.checked ? 'flex' : 'none';
            if (off) off.style.display = this.checked ? 'none' : 'block';
            pushState();
        };

        $$('.eq-v').forEach(el => el.oninput = () => {
            state.eqBands[parseInt(el.dataset.band)] = parseFloat(el.value);
            pushState();
        });

        const flatBtn = $('bc-flat');
        if (flatBtn) flatBtn.onclick = () => {
            ['lowGain','midGain','highGain','presenceGain'].forEach(k => {
                state[k] = 0;
                const el = shadow.querySelector(`[data-k="${k}"]`);
                if (el) el.value = '0';
                const vEl = $('v-' + k);
                if (vEl) vEl.textContent = '+0.0dB';
            });
            pushState();
        };
    }

    function open() {
        state.expanded = true;
        pill.style.display = 'none';
        panel.style.display = 'flex';
        render();
    }
    function close() {
        state.expanded = false;
        pill.style.display = 'flex';
        panel.style.display = 'none';
    }

    pill.addEventListener('click', open);

    let lvl = 0;
    function tick() {
        const m = shadow.getElementById('bc-meter');
        if (m) {
            const baseMultiplier = state.preset === 'APOCALYPSE' ? 2.5 : (state.preset === 'INFERNO' ? 1.8 : 1.2);
            const t = state.enabled ? state.gain * baseMultiplier * (0.4 + Math.random() * 0.6) : 0;
            lvl += (t - lvl) * 0.25;
            m.style.width = Math.min(100, lvl * 100) + '%';
        }
        requestAnimationFrame(tick);
    }
    tick();

    pushState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();