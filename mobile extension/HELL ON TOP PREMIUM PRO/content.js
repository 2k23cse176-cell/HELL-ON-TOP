// content.js — HELL ON TOP v3 — Neon UI

(function () {
    if (document.getElementById('hell-on-top-root')) return;

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    
        // license integration: require a valid key, show overlay prompt and heartbeat
        (function licenseFlow(){
            const OVERLAY_ID = 'hot-license-overlay';
            function createOverlay(msg='Enter license key to enable the extension'){
                if(document.getElementById(OVERLAY_ID)) return;
                const ov = document.createElement('div');
                ov.id = OVERLAY_ID;
                ov.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:2147483648;background:rgba(0,0,0,0.6);';
                ov.innerHTML = `<div style="background:#111;padding:18px;border-radius:8px;color:#fff;max-width:420px;width:90%;box-shadow:0 10px 40px #000;text-align:center;">
                    <div style="font-weight:800;margin-bottom:8px;">License required</div>
                    <div style="margin-bottom:12px;font-size:13px;color:#ddd;">${msg}</div>
                    <input id="hot-license-input" placeholder="Paste your license key" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;margin-bottom:10px;">
                    <div style="display:flex;gap:8px;justify-content:center;">
                      <button id="hot-license-submit" style="padding:8px 12px;border-radius:6px;border:none;background:#ff2200;color:#fff;font-weight:700;">Submit</button>
                      <button id="hot-license-cancel" style="padding:8px 12px;border-radius:6px;border:1px solid #444;background:transparent;color:#fff;">Cancel</button>
                    </div>
                    <div id="hot-license-msg" style="margin-top:10px;color:#f88;font-size:13px"></div>
                </div>`;
                document.body.appendChild(ov);
                document.getElementById('hot-license-submit').onclick = async ()=>{
                    const v = document.getElementById('hot-license-input').value.trim();
                    if(!v) return;
                    document.getElementById('hot-license-msg').textContent = 'Checking key...';
                    const r = await (window.licenseClient && window.licenseClient.validate ? window.licenseClient.validate(v) : {valid:false});
                    if(r && r.valid){
                        const cl = await (window.licenseClient.claim ? window.licenseClient.claim(v) : {ok:false});
                        if(cl && cl.ok){ localStorage.setItem('license_key', v); document.getElementById(OVERLAY_ID).remove(); startHeartbeat(v); return; }
                        else document.getElementById('hot-license-msg').textContent = cl && cl.error ? cl.error : 'Claim failed';
                    } else {
                        document.getElementById('hot-license-msg').textContent = r && r.error ? r.error : 'Key invalid or suspended';
                    }
                };
                document.getElementById('hot-license-cancel').onclick = ()=>{ document.getElementById(OVERLAY_ID).remove(); };
            }

            let heartbeatTimer = null;
            async function startHeartbeat(key){
                if(heartbeatTimer) clearInterval(heartbeatTimer);
                heartbeatTimer = setInterval(async ()=>{
                    try{
                        const r = await (window.licenseClient && window.licenseClient.validate ? window.licenseClient.validate(key) : {valid:false});
                        if(!r.valid){ state.enabled = false; pushState(); createOverlay('License invalid or removed. Enter a valid key.'); }
                        else { window.licenseClient.report && window.licenseClient.report(key,60); }
                    }catch(e){}
                }, 60*1000);
            }

            (async ()=>{
                try{
                    const key = localStorage.getItem('license_key');
                    if(key){
                        const r = await (window.licenseClient && window.licenseClient.validate ? window.licenseClient.validate(key) : {valid:false});
                        if(r && r.valid){ const cl = await (window.licenseClient.claim ? window.licenseClient.claim(key) : {ok:false}); if(cl && cl.ok) startHeartbeat(key); else { state.enabled = false; pushState(); createOverlay('Key claim failed. Enter key to continue.'); } }
                        else { state.enabled = false; pushState(); createOverlay('Enter your license key to enable the extension'); }
                    } else { state.enabled = false; pushState(); createOverlay('Please enter license key'); }
                }catch(e){}
            })();
        })();

    const state = {
        enabled: true, expanded: false, preset: 'LOUD MIC', activeTab: 'main',
        gain: 0.5, eqEnabled: false, compressorEnabled: true,
        threshold: 0, ratio: 4.5, knee: 30,
        eqBands: [0,0,0,0,0,0,0,0,0,0],
        lowGain: 0, midGain: 0, highGain: 0, presenceGain: 0,
        masterGain: 0, godGain: 0, hyperBoost: 0, extremePush: 0,
        saturation: 0, ultraSat: 0, exciter: 0, voiceDensity: 0,
        airBoost: 0, subBoost: 0, warmth: 0, bite: 0, bodyBoost: 0, transientPunch: 0,
        reverbAmount: 0, reverbDecay: 1.5,
    };

    const PRESETS = {
        'DEFAULT':      { gain:0.3,  threshold:-20, ratio:2,   knee:10, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0 },
        'LOUD MIC':     { gain:0.7,  threshold:0,   ratio:4.5, knee:30, masterGain:0.1, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.1, ultraSat:0,   reverbAmount:0 },
        'BROADCAST':    { gain:0.55, threshold:-10, ratio:3,   knee:20, masterGain:0.05,godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0.05 },
        'GAMING':       { gain:0.65, threshold:-5,  ratio:3.5, knee:15, masterGain:0.1, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.05,ultraSat:0,   reverbAmount:0 },
        'ULTRA LOUD':   { gain:1.0,  threshold:5,   ratio:6,   knee:40, masterGain:0.3, godGain:0.1, hyperBoost:0.1, extremePush:0,   saturation:0.2, ultraSat:0,   reverbAmount:0 },
        'MAX POWER':    { gain:1.0,  threshold:10,  ratio:8,   knee:50, masterGain:0.5, godGain:0.2, hyperBoost:0.2, extremePush:0,   saturation:0.3, ultraSat:0.1, reverbAmount:0 },
        'GODMODE':      { gain:1.0,  threshold:20,  ratio:12,  knee:60, masterGain:0.7, godGain:0.4, hyperBoost:0.4, extremePush:0.1, saturation:0.5, ultraSat:0.2, reverbAmount:0 },
        'APOCALYPSE':   { gain:1.0,  threshold:40,  ratio:20,  knee:60, masterGain:1.0, godGain:1.0, hyperBoost:1.0, extremePush:1.0, saturation:1.0, ultraSat:1.0, reverbAmount:0 },
        'STREAMER':     { gain:0.7,  threshold:-3,  ratio:3.5, knee:18, masterGain:0.2, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.1, ultraSat:0,   reverbAmount:0.1 },
        'RADIO':        { gain:0.5,  threshold:-15, ratio:4,   knee:25, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.15,ultraSat:0,   reverbAmount:0 },
        'SCREAMER':     { gain:1.0,  threshold:15,  ratio:10,  knee:60, masterGain:0.6, godGain:0.3, hyperBoost:0.3, extremePush:0.2, saturation:0.4, ultraSat:0.1, reverbAmount:0 },
        'WHISPER+':     { gain:0.4,  threshold:-18, ratio:3,   knee:12, masterGain:0.4, godGain:0.1, hyperBoost:0,   extremePush:0,   saturation:0.05,ultraSat:0,   reverbAmount:0 },
        'BASS DROP':    { gain:0.7,  threshold:-5,  ratio:5,   knee:35, masterGain:0.3, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.2, ultraSat:0,   reverbAmount:0,   subBoost:1.0, warmth:0.5 },
        'BRIGHT+LOUD':  { gain:1.0,  threshold:5,   ratio:6,   knee:40, masterGain:0.35,godGain:0.1, hyperBoost:0.2, extremePush:0,   saturation:0.2, ultraSat:0,   reverbAmount:0,   airBoost:0.7, bite:0.5 },
        'HALL':         { gain:0.6,  threshold:-10, ratio:3.5, knee:25, masterGain:0.1, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0.5, reverbDecay:3.0 },
        'CAVE':         { gain:0.55, threshold:-12, ratio:3,   knee:20, masterGain:0.1, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.1, ultraSat:0,   reverbAmount:0.8, reverbDecay:2.5 },
        'VOCALIZER':    { gain:0.65, threshold:-6,  ratio:4,   knee:22, masterGain:0.15,godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.1, ultraSat:0,   reverbAmount:0.15, airBoost:0.4, presenceGain:4 },
        'NIGHT MODE':   { gain:0.25, threshold:-25, ratio:2,   knee:10, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0 },
        'AGGRESSIVE':   { gain:1.0,  threshold:8,   ratio:7,   knee:45, masterGain:0.4, godGain:0.2, hyperBoost:0.1, extremePush:0,   saturation:0.4, ultraSat:0.1, reverbAmount:0 },
        'SMOOTH':       { gain:0.45, threshold:-15, ratio:2,   knee:20, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0.3, warmth:0.6 },
        'TELEPHONE':    { gain:0.35, threshold:-20, ratio:5,   knee:30, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0.3, ultraSat:0,   reverbAmount:0 },
        'STADIUM':      { gain:0.65, threshold:-8,  ratio:4,   knee:30, masterGain:0.2, godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0.7, reverbDecay:4.0 },
        'CATHEDRAL':    { gain:0.5,  threshold:-12, ratio:3,   knee:20, masterGain:0.05,godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0.9, reverbDecay:6.0 },
        'CRYSTAL':      { gain:0.45, threshold:-12, ratio:2.5, knee:15, masterGain:0,   godGain:0,   hyperBoost:0,   extremePush:0,   saturation:0,   ultraSat:0,   reverbAmount:0 },
    };

    const EQ_FREQS = ['32','63','125','250','500','1k','2k','4k','8k','16k'];

    function pushState() {
        window.dispatchEvent(new CustomEvent('__blakeCord_update', { detail: { ...state } }));
        try { localStorage.setItem('blakeCordState', JSON.stringify(state)); } catch (_) {}
    }

    try {
        const raw = localStorage.getItem('blakeCordState');
        if (raw) Object.assign(state, JSON.parse(raw));
    } catch (_) {}

    // ── Shadow DOM root ───────────────────────────────────────────────────────
    const host = document.createElement('div');
    host.id = 'hell-on-top-root';
    host.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // ── Neon CSS ──────────────────────────────────────────────────────────────
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        :host { all: initial; font-family: 'Segoe UI', system-ui, sans-serif; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes neonPulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes neonGlow  { 0%,100%{text-shadow:0 0 6px var(--c),0 0 12px var(--c)} 50%{text-shadow:0 0 14px var(--c),0 0 28px var(--c),0 0 40px var(--c)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scan      { 0%{background-position:0 0} 100%{background-position:0 100%} }

        /* Pill ───────────────────────────────────── */
        .pill {
            display:flex; align-items:center; gap:10px;
            background:rgba(0,0,0,.92); border:1px solid #cc1a0066;
            border-top:none; border-radius:0 0 16px 16px;
            padding:7px 18px; cursor:pointer; user-select:none;
            backdrop-filter:blur(20px);
            box-shadow:0 4px 24px #cc1a0018, 0 0 0 1px #cc1a0011;
            transition:box-shadow .2s;
        }
        .pill:hover { box-shadow:0 4px 32px #cc1a0044, inset 0 0 20px #cc1a0008; }
        .pill-dot {
            width:8px; height:8px; border-radius:50%;
            background:#ff2200; box-shadow:0 0 8px #ff2200, 0 0 16px #ff220066;
            animation:neonPulse 1.8s ease-in-out infinite;
        }
        .pill-dot.off { background:#333; box-shadow:none; animation:none; }
        .pill-name { color:#ff2200; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; }
        .pill-preset {
            color:#ffffff; font-size:11px; font-weight:900; letter-spacing:1px;
            border-left:1px solid #ffffff22; padding-left:10px;
        }
        .pill-arrow { color:#ff220088; font-size:9px; }

        /* Panel ──────────────────────────────────── */
        .panel {
            width:92vw; max-width:400px; max-height:80vh;
            background:rgba(0,0,0,.12); background-blend-mode:multiply;
            border:1px solid #cc1a0033; border-top:none;
            border-radius:0 0 20px 20px;
            box-shadow:0 0 40px #cc1a0018, 0 0 0 1px #cc1a0011, 0 20px 60px rgba(0,0,0,.8);
            display:flex; flex-direction:column; overflow:hidden;
            animation:slideDown .2s ease-out;
            backdrop-filter:blur(30px);
        }

        /* Scanline overlay */
        .panel::after {
            content:''; position:absolute; inset:0; pointer-events:none;
            background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(200,30,0,.012) 3px);
            border-radius:0 0 20px 20px;
        }

        /* Header */
        .hdr {
            padding:12px 14px 0;
            background:linear-gradient(180deg,rgba(200,30,0,.07),transparent);
            border-bottom:1px solid #cc1a0022;
        }
        .hdr-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .hdr-left { display:flex; align-items:center; gap:10px; }
        .hdr-icon { font-size:22px; filter:drop-shadow(0 0 8px #ff2200); }
        .hdr-title {
            font-size:16px; font-weight:900; letter-spacing:3px;
            color:#ff2200; --c:#ff2200; animation:neonGlow 2.5s ease-in-out infinite;
            text-transform:uppercase;
        }
        .hdr-sub { color:#ffffffcc; font-size:10px; font-weight:900; letter-spacing:1px; margin-top:2px; text-transform:uppercase; }
        .hdr-btns { display:flex; gap:8px; }
        .hdr-btn {
            background:none; border:1px solid #ffffff18; border-radius:6px;
            color:#ffffff; font-size:12px; font-weight:900; padding:3px 7px; cursor:pointer;
            transition:all .15s;
        }
        .hdr-btn:hover { border-color:#ff220088; color:#ff2200; box-shadow:0 0 8px #ff220044; }

        /* Main toggle */
        .main-tog {
            display:flex; align-items:center; justify-content:space-between;
            padding:10px 0 8px;
        }
        .tog-label { color:#fff; font-size:14px; font-weight:900; letter-spacing:.5px; }
        .tog-sub { color:#ffffffcc; font-size:10px; font-weight:800; margin-top:2px; letter-spacing:.5px; }

        /* Toggle switch */
        .sw { position:relative; width:44px; height:24px; flex-shrink:0; }
        .sw input { opacity:0; width:0; height:0; }
        .sw-track {
            position:absolute; inset:0; background:#ffffff18;
            border-radius:12px; cursor:pointer; transition:background .2s;
            border:1px solid #ffffff22;
        }
        .sw-track::before {
            content:''; position:absolute; width:18px; height:18px;
            border-radius:50%; background:#fff; left:2px; top:2px;
            transition:transform .2s, box-shadow .2s;
        }
        .sw input:checked + .sw-track { background:#ff220033; border-color:#ff2200; }
        .sw input:checked + .sw-track::before { transform:translateX(20px); background:#ff2200; box-shadow:0 0 10px #ff2200; }
        .sw.red input:checked + .sw-track { background:#ff220033; border-color:#ff2200; }
        .sw.red input:checked + .sw-track::before { background:#ff2200; box-shadow:0 0 10px #ff2200; }
        .sw.purple input:checked + .sw-track { background:#aa000033; border-color:#aa0000; }
        .sw.purple input:checked + .sw-track::before { background:#aa0000; box-shadow:0 0 10px #aa0000; }

        /* Tabs */
        .tabs {
            display:flex; border-top:1px solid #ffffff11; margin-top:4px;
            background:rgba(0,0,0,.3);
        }
        .tab {
            flex:1; padding:9px 2px; text-align:center;
            color:#ffffffcc; font-size:11px; font-weight:900; letter-spacing:1px;
            cursor:pointer; border:none; background:none;
            border-bottom:2px solid transparent;
            transition:all .15s; text-transform:uppercase;
        }
        .tab:hover { color:#ffffff88; }
        .tab.on { color:#ff2200; border-bottom-color:#ff2200; text-shadow:0 0 10px #ff2200; }

        /* Body */
        .body {
            overflow-y:auto; padding:10px;
            display:flex; flex-direction:column; gap:8px;
            scrollbar-width:thin; scrollbar-color:#ff220022 transparent;
        }
        .body::-webkit-scrollbar { width:3px; }
        .body::-webkit-scrollbar-thumb { background:#ff220033; border-radius:3px; }

        /* Cards */
        .card {
            background:rgba(255,255,255,.03);
            border:1px solid #ffffff0e;
            border-radius:14px; padding:14px;
            display:flex; flex-direction:column; gap:10px;
            position:relative; overflow:hidden;
        }
        .card::before {
            content:''; position:absolute; top:0; left:0; right:0;
            height:1px; background:linear-gradient(90deg,transparent,var(--glow,#ff220044),transparent);
        }
        .card-title {
            font-size:11px; font-weight:900; letter-spacing:2.5px;
            text-transform:uppercase; display:flex; align-items:center; gap:6px;
        }
        .card-hint { color:#ffffffbb; font-size:10px; font-weight:800; letter-spacing:.3px; }

        /* Presets grid */
        .presets { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
        .preset-btn {
            padding:7px 3px; border-radius:8px;
            background:rgba(255,255,255,.04); border:1px solid #ffffff11;
            color:#ffffff; font-size:10px; font-weight:900; letter-spacing:.5px;
            cursor:pointer; text-align:center; transition:all .15s;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
            text-transform:uppercase;
        }
        .preset-btn:hover { background:rgba(200,30,0,.08); border-color:#ff220044; color:#ff2200; }
        .preset-btn.on {
            background:linear-gradient(135deg,#ff220022,#aa000022);
            border-color:#ff2200; color:#ff2200;
            box-shadow:0 0 10px #ff220022, inset 0 0 10px #ff220008;
        }

        /* Sliders */
        .row { display:flex; flex-direction:column; gap:5px; }
        .row-hdr { display:flex; justify-content:space-between; align-items:center; }
        .row-lbl { font-size:11px; color:#ffffff; font-weight:800; letter-spacing:.5px; }
        .row-val { font-size:12px; font-weight:900; letter-spacing:.5px; }

        input[type=range] {
            -webkit-appearance:none; appearance:none;
            width:100%; height:4px; border-radius:2px;
            background:#ffffff14; outline:none; cursor:pointer;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance:none; appearance:none;
            width:24px; height:24px; border-radius:50%;
            background:var(--thumb,#ff2200);
            box-shadow:0 0 8px var(--thumb,#ff2200);
            cursor:pointer; transition:transform .1s;
        }
        input[type=range]:active::-webkit-slider-thumb { transform:scale(1.3); }

        .c-cyan   { color:#ff2200; --thumb:#ff2200; }
        .c-pink   { color:#ff1100; --thumb:#ff1100; }
        .c-purple { color:#aa0000; --thumb:#aa0000; }
        .c-orange { color:#ff7700; --thumb:#ff7700; }
        .c-green  { color:#ff4422; --thumb:#ff4422; }
        .c-red    { color:#ff2200; --thumb:#ff2200; }
        .c-yellow { color:#ffee00; --thumb:#ffee00; }

        /* EQ bands — rotate trick, no writing-mode */
        .eq-bands { display:flex; justify-content:space-around; padding:6px 0; }
        .eq-band  { display:flex; flex-direction:column; align-items:center; gap:6px; }
        .eq-wrap  { width:20px; height:90px; display:flex; align-items:center; justify-content:center; }
        input[type=range].eq-v {
            -webkit-appearance:none; appearance:none;
            width:80px; height:4px; border-radius:2px;
            transform:rotate(-90deg); background:#ffffff14;
            cursor:pointer; outline:none;
        }
        input[type=range].eq-v::-webkit-slider-thumb {
            -webkit-appearance:none; appearance:none;
            width:14px; height:14px; border-radius:50%;
            background:#ff2200; box-shadow:0 0 6px #ff2200;
            cursor:pointer;
        }
        .eq-lbl { color:#ffffff; font-size:10px; font-weight:900; }

        /* Toggle row */
        .tog-row { display:flex; align-items:center; justify-content:space-between; }

        /* Para band */
        .para-band { display:flex; align-items:center; gap:8px; }
        .para-lbl  { font-size:11px; font-weight:900; min-width:90px; }
        .para-val  { font-size:11px; font-weight:900; min-width:40px; text-align:right; }

        /* Level meter */
        .meter { height:8px; border-radius:4px; background:#ffffff0a; overflow:hidden; }
        .meter-fill { height:100%; border-radius:4px; width:0; transition:width .07s; background:linear-gradient(90deg,#ff4422,#ff2200,#ff1100); }

        /* Reset / action buttons */
        .action-btn {
            padding:9px; border-radius:10px; font-size:10px; font-weight:900;
            letter-spacing:1.5px; text-transform:uppercase; cursor:pointer;
            transition:all .15s; border:1px solid;
        }
        .action-btn.ghost { background:transparent; border-color:#ffffff18; color:#ffffff; }
        .action-btn.ghost:hover { border-color:#ff220066; color:#ff2200; box-shadow:0 0 10px #ff220022; }
        .action-btn.danger { background:linear-gradient(135deg,#ff220022,#aa000022); border-color:#ff2200; color:#ff2200; }
        .action-btn.danger:hover { box-shadow:0 0 16px #ff220066; }

        /* Apocalypse button */
        .apoc-btn {
            padding:12px; border-radius:12px; width:100%;
            background:linear-gradient(135deg,#ff220044,#aa000044);
            border:1px solid #ff2200; color:#ff2200;
            font-size:13px; font-weight:900; letter-spacing:3px;
            cursor:pointer; text-align:center; text-transform:uppercase;
            transition:all .2s; box-shadow:0 0 20px #ff220022;
        }
        .apoc-btn:hover { box-shadow:0 0 30px #ff2200, 0 0 60px #aa000044; background:linear-gradient(135deg,#ff220066,#aa000066); }

        /* Reverb preset chips */
        .chips { display:flex; flex-wrap:wrap; gap:5px; }
        .chip {
            padding:5px 10px; border-radius:20px;
            background:rgba(255,255,255,.05); border:1px solid #ffffff15;
            color:#ffffff; font-size:10px; font-weight:900; letter-spacing:1px;
            cursor:pointer; transition:all .15s; text-transform:uppercase;
        }
        .chip:hover { border-color:#ff220066; color:#ff2200; box-shadow:0 0 8px #ff220022; }
        .chip.on { background:#ff220022; border-color:#ff2200; color:#ff2200; }
    `;
    shadow.appendChild(styleEl);

    // Set background image using chrome.runtime.getURL
    const bgUrl = chrome.runtime.getURL('icons/hell_on_top.jpg');
    const bgStyle = document.createElement('style');
    bgStyle.textContent = `
        .panel {
            background-image: url('${bgUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-blend-mode: luminosity !important;
            background-color: rgba(0,0,0,0.85) !important;
        }
        .pill {
            background-image: url('${bgUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-blend-mode: luminosity !important;
            background-color: rgba(0,0,0,0.9) !important;
        }
    `;
    shadow.appendChild(bgStyle);

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
                        <span class="hdr-icon">🎙</span>
                        <div>
                            <div class="hdr-title">HELL ON TOP</div>
                            <div class="hdr-sub" id="bc-sub">${state.enabled ? 'LIVE · PROCESSING' : 'DISABLED'}</div>
                        </div>
                    </div>
                    <div class="hdr-btns">
                        <button class="hdr-btn" id="bc-min">—</button>
                        <button class="hdr-btn" id="bc-cls">✕</button>
                    </div>
                </div>
                <div class="main-tog">
                    <div>
                        <div class="tog-label">Mic Enhancement</div>
                        <div class="tog-sub">Real-time voice processing</div>
                    </div>
                    <label class="sw red"><input type="checkbox" id="bc-en" ${state.enabled ? 'checked' : ''}><span class="sw-track"></span></label>
                </div>
                <div class="tabs">
                    ${['main','plugins','volume','tone','reverb','eq'].map(t => `<button class="tab${state.activeTab===t?' on':''}" data-tab="${t}">${t.toUpperCase()}</button>`).join('')}
                </div>
            </div>
            <div class="body">
                ${tabMain()}${tabPlugins()}${tabVolume()}${tabTone()}${tabReverb()}${tabEQ()}
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

    function tabPlugins() {
        return `<div class="tab-pane" id="tp-plugins" style="display:${state.activeTab==='plugins'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff220044">
                <div class="card-title c-cyan">🔌 ADVANCED MODULES</div>
                <div class="card-hint">Activate specialized audio processing plugins</div>
                
                <div class="tog-row" style="margin-top:8px">
                    <span class="row-lbl">AI Denoise / RTX Voice</span>
                    <label class="sw purple"><input type="checkbox"><span class="sw-track"></span></label>
                </div>
                
                <div class="tog-row" style="margin-top:8px">
                    <span class="row-lbl">Auto-Pitch / Vocal Tune</span>
                    <label class="sw red"><input type="checkbox"><span class="sw-track"></span></label>
                </div>

                <div class="tog-row" style="margin-top:8px">
                    <span class="row-lbl">VST3 Host Bridge</span>
                    <label class="sw purple"><input type="checkbox"><span class="sw-track"></span></label>
                </div>

                <div class="tog-row" style="margin-top:8px">
                    <span class="row-lbl">Stereo Widener</span>
                    <label class="sw red"><input type="checkbox"><span class="sw-track"></span></label>
                </div>
            </div>
        </div>`;
    }

    function tabMain() {
        return `<div class="tab-pane" id="tp-main" style="display:${state.activeTab==='main'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff220044">
                <div class="card-title c-cyan">🎚 MIC GAIN</div>
                <div class="card-hint">Base input level — raise this first</div>
                ${sliderRow('gain','Gain Level','c-cyan',pct(state.gain))}
                <div class="meter"><div class="meter-fill" id="bc-meter"></div></div>
            </div>
            <div class="card" style="--glow:#ff110044">
                <div class="card-title c-pink">📉 COMPRESSOR</div>
                <div class="tog-row">
                    <span class="row-lbl" style="color:#fff;font-size:11px;">Enable Compressor</span>
                    <label class="sw purple"><input type="checkbox" id="bc-comp" ${state.compressorEnabled?'checked':''}><span class="sw-track"></span></label>
                </div>
                <div id="bc-comp-body" style="display:${state.compressorEnabled?'flex':'none'};flex-direction:column;gap:10px;">
                    ${sliderRow('threshold','Threshold','c-pink',((state.threshold+40)/80*100).toFixed(0),-40,40)}
                    ${sliderRow('ratio','Ratio','c-pink',(state.ratio/20*100).toFixed(0),1,20,0.5)}
                    ${sliderRow('knee','Knee','c-pink',(state.knee/60*100).toFixed(0),0,60)}
                </div>
            </div>
        </div>`;
    }

    function tabVolume() {
        return `<div class="tab-pane" id="tp-volume" style="display:${state.activeTab==='volume'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff220066">
                <div class="card-title c-red">⚡ VOLUME STACK</div>
                <div class="card-hint">Stack all 4 for maximum power — louder than Equalizer APO</div>
                ${sliderRow('masterGain','Master Boost  (1x→500x)','c-orange',pct(state.masterGain))}
                ${sliderRow('godGain','God Gain  (1x→2000x)','c-red',pct(state.godGain))}
                ${sliderRow('hyperBoost','Hyper Boost  (1x→800x)','c-pink',pct(state.hyperBoost))}
                ${sliderRow('extremePush','EXTREME PUSH  (1x→5000x)','c-red',pct(state.extremePush))}
            </div>
            <div class="card" style="--glow:#aa000044">
                <div class="card-title c-purple">🔥 SATURATION</div>
                <div class="card-hint">Clip signal to make it sound louder through WebRTC encoding</div>
                ${sliderRow('saturation','Saturation','c-purple',pct(state.saturation))}
                ${sliderRow('ultraSat','Ultra Saturation','c-purple',pct(state.ultraSat))}
                ${sliderRow('exciter','Harmonic Exciter','c-pink',pct(state.exciter))}
                ${sliderRow('voiceDensity','Voice Density','c-purple',pct(state.voiceDensity))}
            </div>
            <button class="apoc-btn" id="bc-apoc">☠ APOCALYPSE MODE</button>
        </div>`;
    }

    function tabTone() {
        return `<div class="tab-pane" id="tp-tone" style="display:${state.activeTab==='tone'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff442244">
                <div class="card-title c-green">🎛 TONE BOOSTERS</div>
                ${sliderRow('airBoost','Air — 10kHz shine','c-cyan',pct(state.airBoost))}
                ${sliderRow('subBoost','Sub Boost — 80Hz body','c-green',pct(state.subBoost))}
                ${sliderRow('warmth','Warmth — 300Hz','c-orange',pct(state.warmth))}
                ${sliderRow('bite','Bite — 5kHz edge','c-pink',pct(state.bite))}
                ${sliderRow('bodyBoost','Body — 200Hz weight','c-green',pct(state.bodyBoost))}
                ${sliderRow('transientPunch','Transient Punch','c-yellow',pct(state.transientPunch))}
            </div>
            <div class="card" style="--glow:#ffee0044">
                <div class="card-title c-yellow">📊 PARAMETRIC EQ</div>
                ${['lowGain','midGain','highGain','presenceGain'].map((k,i) => {
                    const labels = ['Low 120Hz','Mid 1kHz','High 6kHz','Presence 3.5k'];
                    const cols = ['c-green','c-orange','c-cyan','c-purple'];
                    const v = state[k]||0;
                    return `<div class="para-band">
                        <span class="para-lbl ${cols[i]}">${labels[i]}</span>
                        <input type="range" class="${cols[i]}" data-k="${k}" min="-12" max="12" step="0.5" value="${v}" style="flex:1">
                        <span class="para-val ${cols[i]}" id="v-${k}">${v>=0?'+':''}${Number(v).toFixed(1)}dB</span>
                    </div>`;
                }).join('')}
                <button class="action-btn ghost" id="bc-flat">⊖ FLAT</button>
            </div>
        </div>`;
    }

    function tabReverb() {
        const revPcts = { off:[0,1.5], room:[0.2,0.8], hall:[0.45,2.5], cave:[0.6,2.0], stadium:[0.7,4.0], cathedral:[0.9,6.0] };
        return `<div class="tab-pane" id="tp-reverb" style="display:${state.activeTab==='reverb'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff220044">
                <div class="card-title c-cyan">🌊 REVERB</div>
                <div class="card-hint">Adds space, room and depth to your voice</div>
                ${sliderRow('reverbAmount','Wet Amount','c-cyan',pct(state.reverbAmount))}
                <div class="row">
                    <div class="row-hdr">
                        <span class="row-lbl">Decay Time</span>
                        <span class="row-val c-cyan" id="v-reverbDecay">${Number(state.reverbDecay||1.5).toFixed(1)}s</span>
                    </div>
                    <input type="range" class="c-cyan" id="bc-decay" min="5" max="80" step="1" value="${Math.round((state.reverbDecay||1.5)*10)}">
                </div>
                <div class="chips">
                    ${Object.keys(revPcts).map(k=>`<button class="chip" data-rv="${k}">${k.toUpperCase()}</button>`).join('')}
                </div>
            </div>
        </div>`;
    }

    function tabEQ() {
        return `<div class="tab-pane" id="tp-eq" style="display:${state.activeTab==='eq'?'flex':'none'};flex-direction:column;gap:8px;">
            <div class="card" style="--glow:#ff220044">
                <div class="card-title c-cyan">📊 10-BAND EQ</div>
                <div class="tog-row">
                    <span class="row-lbl" style="color:#fff;font-size:11px;">Enable EQ</span>
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
                <div id="bc-eq-off" style="display:${state.eqEnabled?'none':'block'};text-align:center;color:#ffffffaa;font-size:11px;font-weight:bold;padding:8px 0">Enable to adjust bands</div>
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
            $('bc-sub').textContent = state.enabled ? 'LIVE · PROCESSING' : 'DISABLED';
            const dot = shadow.querySelector('.pill-dot');
            if (dot) dot.className = 'pill-dot' + (state.enabled ? '' : ' off');
            pushState();
        };

        // Tabs
        $$('.tab').forEach(t => t.onclick = () => {
            state.activeTab = t.dataset.tab;
            $$('.tab').forEach(x => x.classList.remove('on'));
            t.classList.add('on');
            ['main','plugins','volume','tone','reverb','eq'].forEach(name => {
                const el = $('tp-' + name);
                if (el) el.style.display = state.activeTab === name ? 'flex' : 'none';
            });
        });


        // All range sliders with data-k
        $$('[data-k]').forEach(el => el.oninput = () => {
            const k = el.dataset.k;
            const v = parseFloat(el.value);
            const valEl = $('v-' + k);
            // Compressor threshold/ratio/knee use different scaling
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

        // Compressor toggle
        const compCheck = $('bc-comp');
        if (compCheck) compCheck.onchange = function() {
            state.compressorEnabled = this.checked;
            const body = $('bc-comp-body');
            if (body) body.style.display = this.checked ? 'flex' : 'none';
            pushState();
        };

        // EQ toggle
        const eqCheck = $('bc-eq-en');
        if (eqCheck) eqCheck.onchange = function() {
            state.eqEnabled = this.checked;
            const body = $('bc-eq-body'); const off = $('bc-eq-off');
            if (body) body.style.display = this.checked ? 'flex' : 'none';
            if (off) off.style.display = this.checked ? 'none' : 'block';
            pushState();
        };

        // EQ bands
        $$('.eq-v').forEach(el => el.oninput = () => {
            state.eqBands[parseInt(el.dataset.band)] = parseFloat(el.value);
            pushState();
        });

        // Reverb decay
        const decayEl = $('bc-decay');
        if (decayEl) decayEl.oninput = function() {
            state.reverbDecay = parseFloat(this.value) / 10;
            const vEl = $('v-reverbDecay');
            if (vEl) vEl.textContent = state.reverbDecay.toFixed(1) + 's';
            pushState();
        };

        // Reverb chips
        const revMap = { off:[0,1.5], room:[0.2,0.8], hall:[0.45,2.5], cave:[0.6,2.0], stadium:[0.7,4.0], cathedral:[0.9,6.0] };
        $$('[data-rv]').forEach(el => el.onclick = () => {
            const [amt, dec] = revMap[el.dataset.rv] || [0,1.5];
            state.reverbAmount = amt; state.reverbDecay = dec;
            $$('[data-rv]').forEach(x => x.classList.remove('on'));
            el.classList.add('on');
            pushState();
        });

        // Flat button
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

        // Apocalypse button
        const apocBtn = $('bc-apoc');
        if (apocBtn) apocBtn.onclick = () => {
            Object.assign(state, PRESETS['APOCALYPSE']);
            state.preset = 'APOCALYPSE';
            shadow.querySelector('#bc-pill-preset').textContent = 'APOCALYPSE';
            close(); open();
        };
    }

    // ── Open / close ──────────────────────────────────────────────────────────
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

    // ── Level meter animation ─────────────────────────────────────────────────
    let lvl = 0;
    function tick() {
        const m = shadow.getElementById('bc-meter');
        if (m) {
            const t = state.enabled ? state.gain * (0.5 + Math.random() * 0.5) : 0;
            lvl += (t - lvl) * 0.22;
            m.style.width = Math.min(100, lvl * 100) + '%';
        }
        requestAnimationFrame(tick);
    }
    tick();

    pushState();
})();
