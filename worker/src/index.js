<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deep Sea Lab // Bathysphere (AI Mission Generator & CMS)</title>
    <style>
        :root {
            --bg-abyss: #030813;
            --panel-bg: rgba(13, 27, 42, 0.96);
            --cyan-glow: #00f2fe;
            --cyan-dim: #0582ca;
            --gold-glow: #ffb703;
            --danger-neon: #ff0055;
            --success-neon: #00f5d4;
            --uv-glow: #bd00ff;
            --border-hud: rgba(0, 242, 254, 0.35);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: var(--bg-abyss);
            color: #e0f2fe;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-image: 
                radial-gradient(circle at 50% 15%, rgba(0, 242, 254, 0.08) 0%, transparent 60%),
                linear-gradient(to bottom, #02050d 0%, #051021 100%);
        }

        body.inclusive-font {
            font-family: 'Comic Sans MS', sans-serif !important;
            letter-spacing: 0.12em !important;
            line-height: 1.8 !important;
        }

        header {
            width: 100%;
            background: rgba(11, 23, 42, 0.95);
            padding: 12px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border-hud);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .hud-actions { display: flex; gap: 10px; }

        .hud-btn {
            background: rgba(5, 130, 202, 0.15);
            color: var(--cyan-glow);
            border: 1px solid var(--cyan-glow);
            padding: 7px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: 0.2s;
        }
        .hud-btn:hover { background: var(--cyan-glow); color: #000; }

        .btn-teacher {
            border-color: var(--gold-glow);
            color: var(--gold-glow);
            background: rgba(255, 183, 3, 0.1);
        }
        .btn-teacher:hover { background: var(--gold-glow); color: #000; }

        main {
            width: 92%;
            max-width: 950px;
            margin: 20px auto;
        }

        .cockpit-card {
            background: var(--panel-bg);
            border: 1px solid var(--border-hud);
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            text-align: center;
            position: relative;
        }

        .briefing-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-width: 480px;
            margin: 20px auto;
            text-align: left;
        }
        .field-label {
            font-size: 0.8rem;
            color: var(--cyan-glow);
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .briefing-input, .briefing-select {
            padding: 10px 14px;
            border-radius: 6px;
            border: 1px solid var(--border-hud);
            background: #060e1d;
            color: #fff;
            font-size: 0.95rem;
            outline: none;
            width: 100%;
        }

        .quick-nav-panel {
            background: #060e1d;
            border: 2px solid var(--border-hud);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .nav-section-title {
            font-size: 0.78rem;
            color: var(--gold-glow);
            letter-spacing: 1px;
            text-transform: uppercase;
            font-weight: bold;
            margin: 6px 0 4px 0;
            display: flex;
            justify-content: space-between;
        }
        .nav-buttons-row {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .jump-btn {
            background: #0d1e38;
            color: #94a3b8;
            border: 1px solid rgba(0, 242, 254, 0.2);
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            white-space: nowrap;
            font-weight: 600;
        }
        .jump-btn.active {
            background: var(--cyan-glow);
            color: #02050d;
            border-color: var(--cyan-glow);
            font-weight: 800;
        }

        .hud-status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #060e1d;
            border: 1px solid var(--border-hud);
            border-radius: 8px;
            padding: 10px 18px;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }

        .stage-title {
            font-size: 1.15rem;
            color: var(--cyan-glow);
            margin-bottom: 20px;
            line-height: 1.4;
        }

        .custom-media-box {
            margin: 10px auto 15px auto;
            max-width: 400px;
        }
        .custom-media-box img {
            max-width: 100%;
            max-height: 180px;
            border-radius: 8px;
            border: 1px solid var(--cyan-glow);
        }

        .feedback-banner {
            margin-top: 15px;
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            display: none;
        }

        .action-btn {
            background: linear-gradient(135deg, var(--cyan-glow), #0582ca);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
        }
        .action-btn:hover { box-shadow: 0 0 15px rgba(0, 242, 254, 0.5); }

        .opt-btn {
            background: #081224;
            border: 1px solid var(--border-hud);
            color: #fff;
            padding: 10px 16px;
            margin: 5px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
        .opt-btn:hover { background: rgba(0, 242, 254, 0.2); }

        .hud-slider { width: 80%; margin: 15px auto; display: block; }

        .writing-box {
            background: #060e1d;
            border: 2px solid var(--border-hud);
            border-radius: 10px;
            padding: 18px;
            margin: 0 auto 15px auto;
            max-width: 480px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
        }
        .hud-text-input {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 2px solid var(--cyan-glow);
            background: #0a1728;
            color: var(--cyan-glow);
            font-size: 1.1rem;
            font-weight: bold;
            text-align: center;
            outline: none;
        }

        /* CERTIFICATE */
        .certificate-frame {
            background: linear-gradient(135deg, #061124 0%, #030813 100%);
            border: 4px double var(--gold-glow);
            border-radius: 12px;
            padding: 30px;
            margin: 20px auto;
            max-width: 680px;
            box-shadow: 0 0 30px rgba(255, 183, 3, 0.2);
            text-align: center;
            position: relative;
        }
        .cert-header {
            font-size: 1.6rem;
            color: var(--gold-glow);
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .cert-sub {
            font-size: 0.85rem;
            color: #94a3b8;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        .cert-name {
            font-size: 1.8rem;
            color: #fff;
            font-weight: bold;
            border-bottom: 2px solid var(--cyan-glow);
            display: inline-block;
            padding: 0 25px 5px 25px;
            margin-bottom: 15px;
        }
        .cert-body {
            font-size: 0.95rem;
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .cert-meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            background: rgba(0, 242, 254, 0.05);
            border: 1px solid var(--border-hud);
            border-radius: 8px;
            padding: 12px;
            font-size: 0.85rem;
            margin-bottom: 20px;
        }
        .cert-seal { font-size: 2.2rem; margin-bottom: 5px; }

        /* TEACHER DESK & CMS */
        .teacher-desk {
            background: #060e1d;
            border: 2px solid var(--gold-glow);
            border-radius: 12px;
            padding: 20px;
            margin-top: 25px;
            display: none;
            text-align: left;
        }

        /* AI MISSION GENERATOR BOX */
        .ai-generator-panel {
            background: rgba(0, 242, 254, 0.05);
            border: 2px solid var(--cyan-glow);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .ai-panel-title {
            color: var(--cyan-glow);
            font-size: 0.95rem;
            font-weight: bold;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .teacher-form-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            margin-top: 15px;
            padding: 15px;
            background: #091528;
            border-radius: 8px;
            border: 1px solid rgba(255, 183, 3, 0.3);
        }
        .teacher-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .teacher-group label {
            font-size: 0.78rem;
            color: #94a3b8;
            font-weight: bold;
        }
        .teacher-group input, .teacher-group select, .teacher-group textarea {
            background: #0d1e38;
            border: 1px solid #1e3a5f;
            color: #fff;
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-family: inherit;
        }
        .teacher-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .analytics-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.85rem;
            background: #050d1a;
            border-radius: 6px;
            overflow: hidden;
        }
        .analytics-table th, .analytics-table td {
            padding: 10px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            text-align: left;
        }
        .analytics-table th { background: #0b1c36; color: var(--gold-glow); }
        .del-log-btn {
            background: rgba(255, 0, 85, 0.2);
            color: var(--danger-neon);
            border: 1px solid var(--danger-neon);
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
        }
        .del-log-btn:hover { background: var(--danger-neon); color: #fff; }

        /* MECHANICS */
        .fener-area { position: relative; width: 100%; height: 200px; background: #02050d; border: 2px dashed var(--border-hud); overflow: hidden; cursor: crosshair; }
        .hidden-word { position: absolute; font-size: 1.3rem; font-weight: bold; color: #fff; padding: 10px; cursor: pointer; z-index: 1; }
        .dark-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 2; pointer-events: none; }
        .valve-wheel { width: 120px; height: 120px; border: 8px solid #1e3a5f; border-top-color: var(--cyan-glow); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; font-weight: bold; color: var(--gold-glow); text-align: center; padding: 5px; }
        .microscope-lens { width: 140px; height: 140px; border: 6px solid #3a506b; border-radius: 50%; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; background: #fff; color: #000; font-size: 1.2rem; font-weight: bold; filter: blur(15px); }
        .pipe-assembly { min-height: 60px; background: #060e1d; border: 2px dashed var(--border-hud); border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; margin-bottom: 12px; }
        .capsule { background: #0e2744; color: #fff; border: 1px solid var(--cyan-glow); padding: 8px 14px; border-radius: 20px; cursor: pointer; font-weight: bold; margin: 3px; display: inline-block; }
        .periscope-zone { width: 100%; height: 200px; background: radial-gradient(circle, #091a32 0%, #030813 90%); border: 2px solid var(--cyan-glow); border-radius: 12px; display: flex; align-items: center; justify-content: space-around; }
        .bubble-target { background: rgba(0, 242, 254, 0.12); border: 2px solid var(--cyan-glow); padding: 10px 16px; border-radius: 30px; color: #fff; font-weight: bold; cursor: pointer; }
        .scale-station { display: flex; justify-content: space-around; align-items: center; margin-bottom: 15px; }
        .scale-pan { width: 180px; background: #060e1d; border: 2px solid var(--border-hud); border-radius: 10px; padding: 12px; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .switches-row { display: flex; justify-content: center; gap: 20px; margin: 15px 0; }
        .switch-lever { width: 45px; height: 80px; background: #111d33; border: 2px solid var(--border-hud); border-radius: 25px; position: relative; cursor: pointer; }
        .switch-handle { width: 33px; height: 33px; background: #64748b; border-radius: 50%; position: absolute; top: 6px; left: 4px; transition: top 0.2s; }
        .switch-lever.active { border-color: var(--success-neon); background: rgba(0, 245, 212, 0.2); }
        .switch-lever.active .switch-handle { top: 38px; background: var(--success-neon); }
        .uv-chamber { position: relative; width: 100%; height: 160px; background: #01040a; border: 2px solid var(--uv-glow); border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 12px; }
        .uv-secret-text { color: rgba(189, 0, 255, 0.08); font-size: 1.05rem; font-weight: bold; text-align: center; max-width: 80%; }
        .uv-torch-overlay { position: absolute; width: 120px; height: 120px; border-radius: 50%; pointer-events: none; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(189, 0, 255, 0.35) 0%, transparent 75%); border: 1px solid var(--uv-glow); display: none; }

        @media print {
            body * { visibility: hidden; }
            #printableCert, #printableCert * { visibility: visible; }
            #printableCert { position: absolute; left: 0; top: 0; width: 100%; border: 3px solid #000; color: #000; background: #fff !important; }
            .cert-header, .cert-name { color: #000 !important; }
        }
    </style>
</head>
<body>

    <header>
        <h2>DEEP SEA LAB // MISSION CONTROL</h2>
        <div class="hud-actions">
            <button class="hud-btn" onclick="document.body.classList.toggle('inclusive-font')">Easy Font</button>
            <button class="hud-btn btn-teacher" onclick="checkTeacherPassword()">Teacher Desk ⚙️</button>
        </div>
    </header>

    <main>

        <!-- 1. BRIEFING SCREEN -->
        <div class="cockpit-card" id="briefingScreen">
            <div style="padding:10px;">
                <h2 style="color:var(--cyan-glow); margin-bottom:6px;">DIVE BRIEFING & START</h2>
                <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:20px;">Type your name and choose your role before you start the mission.</p>
                
                <div class="briefing-form">
                    <div>
                        <div class="field-label">1. Your Name</div>
                        <input type="text" id="inputPilotName" class="briefing-input" placeholder="Type your name..." autocomplete="off">
                    </div>

                    <div>
                        <div class="field-label">2. Choose Your Role</div>
                        <select id="selectPilotRole" class="briefing-select">
                            <option value="Subsea Technician">Subsea Technician (Hardware & Tools)</option>
                            <option value="Hydro-Linguist Specialist">Hydro-Linguist Specialist (Language & Code)</option>
                            <option value="Deep Sea Commander">Deep Sea Commander (Tactics & Recon)</option>
                        </select>
                    </div>

                    <div>
                        <div class="field-label">3. How do you feel right now?</div>
                        <select id="selectPilotFeeling" class="briefing-select">
                            <option value="⚡ Excited & Ready">⚡ Excited & Ready</option>
                            <option value="🌊 Calm & Curious">🌊 Calm & Curious</option>
                            <option value="⚠️ A bit careful">⚠️ A bit careful</option>
                        </select>
                    </div>

                    <button class="action-btn" style="padding:14px; margin-top:10px;" onclick="startExpedition()">START MISSION 🌊</button>
                </div>
            </div>
        </div>

        <!-- 2. GAME CONSOLE -->
        <div id="gameContainer" style="display:none;">

            <div class="quick-nav-panel">
                <div class="nav-section-title"><span>Module: Vocabulary & Salvage</span></div>
                <div class="nav-buttons-row" id="rowM1"></div>

                <div class="nav-section-title"><span>Module: Syntax & Structure</span></div>
                <div class="nav-buttons-row" id="rowM2"></div>

                <div class="nav-section-title"><span>Module: Acoustic Signals</span></div>
                <div class="nav-buttons-row" id="rowM3"></div>

                <div class="nav-section-title"><span>Module: Deep Sea Reading</span></div>
                <div class="nav-buttons-row" id="rowM4"></div>

                <div class="nav-section-title" style="color:var(--cyan-glow);"><span>Module: Cipher & Writing</span></div>
                <div class="nav-buttons-row" id="rowM5"></div>

                <div class="nav-section-title" style="color:var(--gold-glow);"><span>Module: Emergency Protocol</span></div>
                <div class="nav-buttons-row" id="rowM6"></div>
            </div>

            <div class="cockpit-card">
                <div class="hud-status-bar">
                    <div>PLAYER: <span style="color:var(--cyan-glow); font-weight:bold;" id="hudPilot">-</span></div>
                    <div>ROLE: <span style="color:var(--gold-glow);" id="hudRole">-</span></div>
                    <div>SCORE: <span style="color:var(--success-neon); font-weight:bold;" id="hudScore">0 XP</span></div>
                </div>

                <div class="stage-title" id="stagePrompt">Loading...</div>

                <div class="custom-media-box" id="mediaBox" style="display:none;"></div>

                <div id="game1" style="display:none;"><div class="fener-area" id="fenerArea" onmousemove="moveFener(event)"><div class="hidden-word" id="g1W1" style="top:25%; left:12%;"></div><div class="hidden-word" id="g1W2" style="top:50%; left:55%;"></div><div class="hidden-word" id="g1W3" style="top:75%; left:28%;"></div><div class="dark-mask" id="darkMask"></div></div></div>
                <div id="game2" style="display:none;"><div style="padding:15px;"><div style="color:var(--gold-glow); font-weight:bold; font-size:1.2rem; margin-bottom:15px;" id="g2Source"></div><div id="g2Options"></div></div></div>
                <div id="game3" style="display:none;"><div class="valve-wheel" id="valveWheel">-</div><input type="range" class="hud-slider" id="valveSlider" min="0" max="360" value="0" oninput="rotateValve(this.value)"><button class="action-btn" onclick="checkValve()">Lock Valve</button></div>
                <div id="game4" style="display:none;"><div style="padding:15px;"><div style="color:var(--gold-glow); font-weight:bold; font-size:1.2rem; margin-bottom:15px;" id="g4Cargo"></div><div id="g4Options"></div></div></div>
                <div id="game5" style="display:none;"><div class="microscope-lens" id="microLens">SPECIMEN</div><input type="range" class="hud-slider" id="microSlider" min="0" max="20" value="15" oninput="adjustFocus(this.value)"><div id="g5Options" style="margin-top:10px;"></div></div>

                <div id="game6" style="display:none;"><div class="pipe-assembly" id="pipeLine"><span style="color:#64748b;" id="pipePlaceholder">Put words in order...</span></div><div id="capsulesPool"></div><div style="margin-top:10px;"><button class="action-btn" onclick="checkPipeAssembly()">Check Sentence</button><button class="opt-btn" onclick="resetPipe()">Reset</button></div></div>
                <div id="game7" style="display:none;"><div style="background:#040914; padding:12px; border-radius:8px; margin-bottom:12px;"><div style="font-size:1.8rem; font-weight:bold; color:var(--cyan-glow);" id="freqLabel">90.0 MHz</div><div id="freqStatus" style="font-size:0.85rem; color:#94a3b8;">Tune Radio</div></div><input type="range" class="hud-slider" min="80" max="140" value="90" oninput="tuneRadio(this.value)"><button class="action-btn" onclick="checkRadioFreq()">Lock Frequency</button></div>
                <div id="game8" style="display:none;"><div class="periscope-zone" id="g8Bubbles"></div></div>
                <div id="game9" style="display:none;"><div class="scale-station"><div class="scale-pan"><div style="font-size:0.75rem; color:#64748b;">SUBJECT</div><div style="font-size:1.1rem; font-weight:bold; color:var(--cyan-glow);" id="g9Subject">-</div></div><div style="font-size:1.8rem; color:var(--gold-glow);">⚖️</div><div class="scale-pan"><div style="font-size:0.75rem; color:#64748b;">VERB</div><div id="panVerbDisplay" style="color:#64748b; font-weight:bold;">Select</div></div></div><div id="g9Options"></div></div>
                <div id="game10" style="display:none;"><div style="background:#060e1d; border:1px solid var(--gold-glow); padding:12px; border-radius:6px; margin-bottom:12px; font-family:monospace; color:var(--gold-glow);" id="g10Prompt">-</div><div id="g10Options"></div></div>

                <div id="game11" style="display:none;"><div style="background:#050d1a; padding:15px; border-radius:8px; margin-bottom:15px;"><audio id="audioG11" controls style="width:80%;"></audio><div style="font-size:0.8rem; color:#94a3b8; margin-top:6px;" id="g11Trans">-</div></div><div id="g11Options"></div></div>
                <div id="game12" style="display:none;"><div style="background:#050d1a; padding:15px; border-radius:8px; margin-bottom:15px;"><audio id="audioG12" controls style="width:80%;"></audio><div style="font-size:0.8rem; color:#94a3b8; margin-top:6px;" id="g12Trans">-</div></div><div id="g12Options"></div></div>
                <div id="game13" style="display:none;"><div style="background:#050d1a; padding:15px; border-radius:8px; margin-bottom:15px;"><audio id="audioG13" controls style="width:80%;"></audio><div style="font-size:0.8rem; color:#94a3b8; margin-top:6px;" id="g13Trans">-</div></div><div id="g13Options"></div></div>
                <div id="game14" style="display:none;"><div style="background:#050d1a; padding:15px; border-radius:8px; margin-bottom:15px;"><audio id="audioG14" controls style="width:80%;"></audio><div style="font-size:0.8rem; color:#94a3b8; margin-top:6px;" id="g14Trans">-</div></div><div id="g14Options"></div></div>
                <div id="game15" style="display:none;"><div style="background:#050d1a; padding:15px; border-radius:8px; margin-bottom:15px;"><audio id="audioG15" controls style="width:80%;"></audio><div style="font-size:0.8rem; color:#94a3b8; margin-top:6px;" id="g15Trans">-</div></div><div class="switches-row" id="g15Switches"></div><button class="opt-btn" onclick="resetSwitches()">Reset Levers</button></div>

                <div id="game16" style="display:none;"><div class="uv-chamber" id="uvChamber" onmousemove="moveUV(event)" onmouseleave="hideUV()"><div class="uv-secret-text" id="uvText">-</div><div class="uv-torch-overlay" id="uvOverlay"></div></div><div id="g16Options"></div></div>
                <div id="game17" style="display:none;"><div style="background:#111a28; border-left:4px solid var(--gold-glow); padding:12px; text-align:left; margin-bottom:12px;" id="g17Log">-</div><div id="g17Options"></div></div>
                <div id="game18" style="display:none;"><div style="background:#071326; padding:12px; border-left:4px solid var(--gold-glow); margin-bottom:12px;" id="g18Desc">-</div><div id="g18Options"></div></div>
                <div id="game19" style="display:none;"><div style="background:#08172e; padding:12px; border:1px solid var(--cyan-glow); margin-bottom:12px; text-align:left;" id="g19Text">-</div><div id="g19Options"></div></div>
                <div id="game20" style="display:none;"><div style="background:#050d1a; padding:12px; margin-bottom:12px;" id="g20Table">-</div><div id="g20Options"></div></div>

                <div id="game21" style="display:none;"><div class="writing-box"><div style="font-size:0.9rem; color:#94a3b8;" id="g21Hint">-</div><div style="font-size:1.4rem; color:var(--gold-glow); font-weight:bold;" id="g21Display">-</div><input type="text" class="hud-text-input" id="inputGame21" placeholder="TYPE HERE..."><button class="action-btn" onclick="checkWriting(21)">Confirm</button></div></div>
                <div id="game22" style="display:none;"><div class="writing-box"><div style="font-size:0.9rem; color:#94a3b8;" id="g22Hint">-</div><div style="font-size:1.1rem; color:#fff; font-weight:bold;" id="g22Display">-</div><input type="text" class="hud-text-input" id="inputGame22" placeholder="TYPE HERE..."><button class="action-btn" onclick="checkWriting(22)">Confirm</button></div></div>
                <div id="game23" style="display:none;"><div class="writing-box"><div style="font-size:0.9rem; color:#94a3b8;" id="g23Hint">-</div><div style="font-size:1.5rem;" id="g23Display">-</div><input type="text" class="hud-text-input" id="inputGame23" placeholder="TYPE HERE..."><button class="action-btn" onclick="checkWriting(23)">Confirm</button></div></div>
                <div id="game24" style="display:none;"><div class="writing-box"><div style="font-size:0.9rem; color:#94a3b8;" id="g24Hint">-</div><div style="font-size:1.2rem; color:var(--danger-neon); font-weight:bold;" id="g24Display">-</div><input type="text" class="hud-text-input" id="inputGame24" placeholder="TYPE CODE..."><button class="action-btn" onclick="checkWriting(24)">Confirm</button></div></div>
                <div id="game25" style="display:none;"><div class="writing-box"><div style="font-size:0.9rem; color:#94a3b8;" id="g25Hint">-</div><div style="font-size:1.1rem; color:#fff;" id="g25Display">-</div><input type="text" class="hud-text-input" id="inputGame25" placeholder="TYPE HERE..."><button class="action-btn" onclick="checkWriting(25)">Confirm</button></div></div>

                <div id="game26" style="display:none;"><div style="background:#050d1a; border:2px solid var(--gold-glow); padding:15px; border-radius:8px; margin-bottom:15px;" id="g26Desc">-</div><div id="g26Options"></div></div>
                <div id="game27" style="display:none;"><div style="background:#050d1a; border:1px solid var(--cyan-glow); padding:15px; border-radius:8px; margin-bottom:15px;" id="g27Desc">-</div><div id="g27Options"></div></div>
                <div id="game28" style="display:none;"><div style="background:#071326; border:1px solid var(--border-hud); padding:15px; border-radius:8px; margin-bottom:15px;" id="g28Desc">-</div><div id="g28Options"></div></div>
                <div id="game29" style="display:none;"><div style="background:#050d1a; border:1px solid var(--cyan-glow); padding:15px; border-radius:8px; margin-bottom:15px; font-size:0.9rem;" id="g29Desc">-</div><div id="g29Options"></div></div>
                <div id="game30" style="display:none;"><div style="background:radial-gradient(circle, #0d274c 0%, #030813 90%); border:2px solid var(--success-neon); padding:20px; border-radius:12px; margin-bottom:15px;"><div style="font-size:1.6rem; color:var(--success-neon); font-weight:bold;" id="g30Title">MISSION FINISHED!</div><div style="font-size:0.95rem; color:#cbd5e1; margin-top:8px;" id="g30Desc">You completed all stations.</div></div><button class="action-btn" onclick="openReflectionModal()">SEE RESULTS & CERTIFICATE 📜</button></div>

                <div class="feedback-banner" id="feedback"></div>

                <div style="display:flex; justify-content:space-between; margin-top:25px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1);">
                    <button class="hud-btn" onclick="prevGame()">⬅ Previous</button>
                    <button class="hud-btn" onclick="nextGame()">Next ➡</button>
                </div>
            </div>
        </div>

        <!-- 3. DEBRIEFING & CERTIFICATE SCREEN -->
        <div class="cockpit-card" id="debriefScreen" style="display:none;">
            
            <div id="reflectionBox">
                <h2 style="color:var(--cyan-glow); margin-bottom:8px;">MISSION REVIEW</h2>
                <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:20px;">How was your mission? Write down your thoughts.</p>

                <div class="briefing-form" style="margin-top:10px;">
                    <div>
                        <div class="field-label">1. How do you feel about your score?</div>
                        <select id="selectPostFeeling" class="briefing-select">
                            <option value="🏆 Great & Confident">🏆 Great & Confident</option>
                            <option value="🧠 A bit hard, but I learned">🧠 A bit hard, but I learned</option>
                            <option value="🔍 I need more practice">🔍 I need more practice</option>
                        </select>
                    </div>

                    <div>
                        <div class="field-label">2. What was your favorite word or rule you learned?</div>
                        <input type="text" id="inputKeyTakeaway" class="briefing-input" placeholder="e.g., I learned how to use submarine and diving.">
                    </div>

                    <button class="action-btn" style="padding:12px; margin-top:10px;" onclick="generateCertificate()">GET MY CERTIFICATE 📜</button>
                </div>
            </div>

            <div id="certificateContainer" style="display:none; margin-top:20px;">
                <div class="certificate-frame" id="printableCert">
                    <div class="cert-seal">🎖️</div>
                    <div class="cert-header">CERTIFICATE OF ACHIEVEMENT</div>
                    <div class="cert-sub">BATHYSPHERE MISSION ACCREDITATION</div>
                    
                    <div style="font-size:0.85rem; color:#94a3b8; margin-top:15px;">This is proudly presented to:</div>
                    <div class="cert-name" id="certPilotName">-</div>

                    <div class="cert-body" id="certBodyText">
                        For successfully completing the deep sea mission and exploring all stations aboard Bathysphere 1.0.
                    </div>

                    <div class="cert-meta-grid">
                        <div><strong>ROLE:</strong><br><span id="certRole" style="color:var(--gold-glow);">-</span></div>
                        <div><strong>SCORE:</strong><br><span id="certScore" style="color:var(--success-neon); font-weight:bold;">-</span></div>
                        <div><strong>DATE:</strong><br><span id="certDate">-</span></div>
                    </div>

                    <div style="font-size:0.8rem; color:#94a3b8; border-top:1px dashed rgba(255,255,255,0.1); padding-top:10px; font-style:italic;">
                        "Student Note: <span id="certReflectNote" style="color:#e0f2fe;">-</span>"
                    </div>
                </div>

                <div style="display:flex; justify-content:center; gap:12px; margin-top:20px;">
                    <button class="action-btn" onclick="window.print()">Print / Save as PDF 🖨️</button>
                    <button class="hud-btn" onclick="restartExpedition()">Start New Game 🔄</button>
                </div>
            </div>

        </div>

        <!-- 4. TEACHER DESK -->
        <div class="teacher-desk" id="teacherDesk">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:var(--gold-glow);">TEACHER DESK</h3>
                <button class="hud-btn" style="padding:4px 8px;" onclick="toggleTeacherDesk()">✕ Close</button>
            </div>
            <p style="font-size:0.8rem; color:#94a3b8; margin-top:5px;">Manage station contents, generate AI missions without an API key, and view student analytics.</p>

            <!-- 🤖 AI MISSION GENERATOR -->
            <div class="ai-generator-panel">
                <div class="ai-panel-title">🤖 AI MISSION GENERATOR (Syllabus & Document Analyzer)</div>
                <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:10px;">
                    Paste curriculum objectives, vocabulary, lesson notes, or upload a PDF / book-page photo. No API key is required.
                </div>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <textarea id="aiTopicInput" rows="4" placeholder="Paste lesson objectives, target language, vocabulary list, CEFR level, or detailed curriculum notes here..." style="width:100%; padding:10px; background:#071226; color:#fff; border:1px solid var(--cyan-glow); border-radius:6px; font-size:0.85rem; font-family:inherit;"></textarea>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;">
                        <div>
                            <label style="font-size:0.78rem; color:var(--gold-glow); font-weight:bold;">AI OUTPUT MODE</label>
                            <select id="aiOutputMode" style="width:100%; margin-top:5px; padding:9px 10px; background:#071226; color:#fff; border:1px solid var(--cyan-glow); border-radius:6px;">
                                <option value="text">📝 Text only — fastest</option>
                                <option value="visual">🖼️ Text + smart visuals</option>
                                <option value="audio">🎧 Text + AI audio</option>
                                <option value="full">✨ Text + AI audio + smart visuals</option>
                            </select>
                            <div style="font-size:0.72rem; color:#64748b; margin-top:4px;">
                                Smart visuals are added only where they genuinely help learning. Maximum: 10.
                            </div>
                        </div>

                        <div>
                            <label style="font-size:0.78rem; color:var(--gold-glow); font-weight:bold;">UPLOAD SOURCE</label>
                            <input type="file" id="aiDocFile" accept="image/*,.pdf,.txt,text/plain" style="width:100%; margin-top:7px; font-size:0.8rem; color:#94a3b8;">
                            <div style="font-size:0.72rem; color:#64748b; margin-top:4px;">
                                Images use AI OCR. Digital PDFs are read directly; scanned PDFs use OCR automatically.
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div style="font-size:0.75rem; color:#94a3b8;">
                            🎧 In audio modes, AI creates real MP3 listening files for stations 11–15. Teachers can edit the transcript, regenerate the audio, or upload their own MP3/WAV.
                        </div>
                        <button class="action-btn" id="btnGenerateAI" onclick="generateMissionWithAI()" style="background:linear-gradient(135deg, var(--cyan-glow), #3b82f6); color:#000;">Generate Mission ⚡</button>
                    </div>
                </div>
                <div id="aiLoadingStatus" style="font-size:0.8rem; color:var(--cyan-glow); margin-top:8px; display:none;">🤖 AI is preparing the mission...</div>
            </div>

            <div style="margin-top:15px; display: flex; gap: 10px; align-items: center; justify-content: space-between;">
                <div style="flex-grow: 1;">
                    <label style="font-size:0.85rem; color:var(--cyan-glow); font-weight:bold;">SELECT STATION TO EDIT (CMS):</label>
                    <select id="admStationSelect" style="width:100%; padding:10px; background:#0d1e38; color:#fff; border:1px solid var(--border-hud); border-radius:6px; margin-top:5px;" onchange="renderTeacherForm()"></select>
                </div>
                <div style="margin-top: 22px;">
                    <button class="hud-btn" style="border-color:var(--gold-glow); color:var(--gold-glow);" onclick="changeMasterPassword()">Change Password 🔑</button>
                </div>
            </div>

            <div id="teacherDynamicFields" class="teacher-form-section"></div>

            <div class="teacher-actions">
                <button class="action-btn" onclick="saveCurrentStation()">Save & Deploy Station 💾</button>
                <button class="hud-btn" style="border-color:#ff9f1c; color:#ff9f1c;" onclick="clearCurrentFormInputs()">Clear Fields (Blank Template) 🧹</button>
                <button class="hud-btn" onclick="exportJSON()">Export Lesson Package (JSON)</button>
                <input type="file" id="importJsonFile" accept=".json" style="display:none;" onchange="importJSON(event)">
                <button class="hud-btn" onclick="document.getElementById('importJsonFile').click()">Import Lesson Package (JSON)</button>
                <button class="hud-btn" style="border-color:var(--danger-neon); color:var(--danger-neon);" onclick="resetToFactoryDefaults()">Reset to Factory Defaults ⚠️</button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px; border-top:1px solid rgba(255,183,3,0.3); padding-top:15px;">
                <h3 style="color:var(--gold-glow);">📊 STUDENT ANALYTICS HISTORY & DIAGNOSTICS</h3>
                <button class="hud-btn" style="border-color:var(--danger-neon); color:var(--danger-neon); padding:5px 10px;" onclick="clearAllStudentLogs()">Clear All Logs 🗑️</button>
            </div>
            <div style="overflow-x:auto;">
                <table class="analytics-table" id="analyticsTable">
                    <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Role</th>
                        <th>Score</th>
                        <th>Incorrect/Missed Stations</th>
                        <th>AI Diagnostic Report</th>
                        <th>Action</th>
                    </tr>
                </table>
            </div>
            <button class="hud-btn" style="margin-top:12px;" onclick="exportStudentLogsCSV()">Export Full Report as CSV 📥</button>
        </div>

    </main>

    <script>
        const AI_WORKER_URL = "https://gentle-dream-d716.bluerisma8.workers.dev/";

        async function callMissionAI(action, payload = {}) {
            const response = await fetch(AI_WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, lang: "en", ...payload })
            });

            let data = {};
            try { data = await response.json(); }
            catch { throw new Error(`AI server returned HTTP ${response.status}.`); }

            if (!response.ok || data.success === false) {
                throw new Error(data.error || `AI request failed with HTTP ${response.status}.`);
            }
            return data;
        }

        const defaultStations = {
            1: { type: "fener", prompt: "Hover the spotlight across the wreckage to locate and select the target hardware:", target: "PROPELLER", decoys: ["RUDDER", "ANCHOR"] },
            2: { type: "kablo", prompt: "Connect the severed electrical lead to the corresponding terminal:", source: "⚡ LEAD: ANCHOR", correct: "Anchor Terminal", distractors: ["Compass Panel", "Boiler Room"] },
            3: { type: "vana", prompt: "Rotate the analog gauge to match the required operational vessel:", targetVal: "SUBMARINE", choices: ["LIFEBOAT", "SUBMARINE", "SONDE"] },
            4: { type: "kargo", prompt: "Route the incoming cargo crate to the designated station department:", cargo: "📦 CRATE: NAVIGATION", correct: "Navigation & Recon", distractors: ["Galley", "Engine Block"] },
            5: { type: "mikroskop", prompt: "Calibrate the slider to 0 to focus the optical lens, then classify the sample:", label: "SPECIMEN", correct: "Biological Specimen", distractors: ["Scrap Metal", "Gauge Sensor"] },
            6: { type: "boru", prompt: "Halt oxygen leakage by arranging the syntax capsules in correct order:", sentence: "The,submarine,is,diving" },
            7: { type: "radyo", prompt: "Calibrate radio frequency to 120.0 MHz present continuous wave:", targetFreq: 120 },
            8: { type: "periskop", prompt: "Target and eliminate the deep-sea bubble containing a grammatical flaw:", correctErr: "The whale is more big", normals: ["The whale is bigger", "The submarine is diving"] },
            9: { type: "terazi", prompt: "Balance the hydro-scale by matching the plural subject with the correct verb:", subject: "The Scientists...", correct: "...discover", distractor: "...discovers" },
            10: { type: "mors", prompt: "Select the missing present progressive suffix to decode the transmission:", text: "The research sub is div[ ? ] right now.", correct: "-ing", distractors: ["-ed", "-s"] },
            11: { type: "ses_sik", prompt: "Listen to the acoustic telegraph signal and identify the distress call:", trans: "[ Acoustic Telegraph Beeps ]", correct: "MAYDAY (Distress Signal)", distractors: ["ROGER (Affirmative)", "STANDBY (Hold)"] },
            12: { type: "ses_sik", prompt: "Analyze the bio-acoustic playback and identify the marine organism:", trans: "[ Low-frequency cetacean reverberation ]", correct: "Blue Whale (Low Echo)", distractors: ["Dolphin Clicks", "Shrimp Clatter"] },
            13: { type: "ses_sik", prompt: "Listen to the Captain's emergency transmission and acknowledge order:", trans: "Emergency: Surface immediately!", correct: "Surface immediately", distractors: ["Increase Speed", "Drop Anchor"] },
            14: { type: "ses_sik", prompt: "Listen to the statement and identify the primary stressed nucleus word:", trans: "We must dive NOW!", correct: "NOW", distractors: ["We", "dive"] },
            15: { type: "salter", prompt: "Listen to the sequence command and pull the safety levers in exact order:", trans: "Order: First Vent, second Power, finally Seal!", order: "Vent,Power,Seal" },
            16: { type: "uv", prompt: "Expose sample to UV light, examine encrypted lab findings and deduce:", text: "SPECIMEN: Organism produces bioluminescence to attract prey in darkness.", correct: "Generates internal light to lure prey.", distractors: ["Flees from luminescent sources.", "Undergoes solar photosynthesis."] },
            17: { type: "okuma_sik", prompt: "Inspect the damaged captain's logbook and confirm safe vector sector:", log: "...Heavy current. Heading towards the trench in Sector Beta, next to the volcano...", correct: "Sector Beta", distractors: ["Sector Alpha", "Sector Gamma"] },
            18: { type: "okuma_sik", prompt: "Examine hydrostatic tolerance parameters and identify the depth zone:", log: "PROFILE: Blind organism, withstands 800 atm hydrostatic pressure with zero light.", correct: "The Abyss (4000m+)", distractors: ["Sunlight Zone (0-200m)", "Twilight Zone (200-1000m)"] },
            19: { type: "okuma_sik", prompt: "Analyze the Viperfish field report and identify feeding adaptation:", log: "OBSERVATION: Needle-like teeth do not fit inside its mouth; impales fast prey in midnight zone.", correct: "Impaling fast prey with needle teeth.", distractors: ["Burrowing into seabed sediment.", "Grazing benthic kelp."] },
            20: { type: "tablo", prompt: "Examine the diagnostic telemetry log and isolate the malfunctioning module:", tableHtml: "Propeller: NORMAL | Reactor Valve: OVERHEAT 98°C | Sonar: NORMAL", correct: "Reactor Valve (Overheat)", distractors: ["Propeller Unit", "Sonar Array"] },
            21: { type: "yazma", prompt: "Input the English cardinal direction shown on the 0° bearing:", hint: "Compass Bearing:", display: "[ 0° / N ]", answers: "NORTH" },
            22: { type: "yazma", prompt: "Complete the sentence by typing the appropriate adjective for abyss pressure:", hint: "Sentence Completion:", display: "The pressure is very [ ? ] in the abyss.", answers: "HIGH,EXTREME" },
            23: { type: "yazma", prompt: "Type the English biological taxon name to label the containment vial:", hint: "Specimen Label:", display: "🐟 / 🦈", answers: "FISH,SHARK,VIPERFISH" },
            24: { type: "yazma", prompt: "Enter the 4-letter emergency access code to release hatch lock:", hint: "Security Override:", display: "LOCK: BLOCKED", answers: "OPEN,EXIT" },
            25: { type: "yazma", prompt: "Sign the dive status report by confirming explorer readiness code:", hint: "Operational Status:", display: "Crew status: [ ? ] for dive.", answers: "READY" },
            26: { type: "okuma_sik", prompt: "Select the mandatory distress radio code for vessel breach:", log: "CRITICAL DEPTH ALARM DETECTED!", correct: "MAYDAY, MAYDAY!", distractors: ["OVER AND OUT", "ROGER THAT"] },
            27: { type: "okuma_sik", prompt: "Water breach detected. Allocate auxiliary reactor power to essential life support:", log: "HULL BREACH: Power must be diverted to vital systems.", correct: "Prioritize Life Support (100%)", distractors: ["Route to Exterior Light Array", "Complete Reactor Shutdown"] },
            28: { type: "okuma_sik", prompt: "Identify the correct protocol sequence for airlock decompression:", log: "AIRLOCK SYSTEM INITIALIZED.", correct: "1. Outer Hatch -> 2. Inner Chamber", distractors: ["1. Inner Chamber -> 2. Open Water"] },
            29: { type: "okuma_sik", prompt: "Verify expedition status following successful sample retrieval and hull seal:", log: "All specimens cataloged and hull integrity sealed. Mission is...", correct: "...SUCCESSFUL", distractors: ["...FAILED", "...ABORTED"] },
            30: { type: "final", prompt: "All 6 modules and 30 telemetry stations verified! Pull ascent lever:", title: "EXPEDITION ACCOMPLISHED!", desc: "All mission objectives completed. Ready to surface." }
        };

        const customModuleNames = {
            1: "Echo Wreckage Salvage", 2: "Abyssal Cable Link", 3: "Pressure Gauge Valve", 4: "Cargo Bay Sorting", 5: "Optical Specimen Lens",
            6: "Oxygen Syntax Pipeline", 7: "Sub-Sonic Radio Tuner", 8: "Periscope Error Radar", 9: "Subject-Verb Hydro-Scale", 10: "Progressive Suffix Decoder",
            11: "Acoustic Telegraph", 12: "Bio-Sonar Reverb", 13: "Captain's Command Log", 14: "Nucleus Stress Pitch", 15: "Sequence Safety Levers",
            16: "UV Bioluminescence Lab", 17: "Volcanic Trench Vector", 18: "Hydrostatic Depth Zone", 19: "Viperfish Field Feed", 20: "Reactor Telemetry Board",
            21: "Cardinal Compass Bearing", 22: "Abyssal Barometer Blank", 23: "Taxon Specimen Label", 24: "Hatch Security Override", 25: "Crew Readiness Seal",
            26: "Mayday Distress Code", 27: "Life Support Routing", 28: "Airlock Decompression", 29: "Hull Integrity Verification", 30: "Ascent Hatch Protocol"
        };

        let customEdited = JSON.parse(localStorage.getItem('bathysphere_cms_custom')) || {};
        let studentLogs = JSON.parse(localStorage.getItem('bathysphere_student_logs')) || [];
        
        let pilot = { name: "Explorer", role: "Subsea Technician", feeling: "Excited", score: 0, visited: [], mistakes: [], postFeeling: "", keyTakeaway: "" };
        let currentGame = 1;

        function getActiveStationData(id) {
            const def = defaultStations[id];
            const cust = customEdited[id] || {};
            return { ...def, ...cust };
        }

        function checkTeacherPassword() {
            let storedPass = localStorage.getItem('bathysphere_master_pass');
            if(!storedPass) {
                let newPass = prompt("🔐 First-Time Teacher Setup: Please create your Master Password:");
                if(newPass && newPass.trim() !== "") {
                    localStorage.setItem('bathysphere_master_pass', newPass.trim());
                    alert("✓ Master password created successfully! Opening Teacher Desk...");
                    toggleTeacherDesk();
                }
                return;
            }
            let pass = prompt("🔒 Authorized Access // Enter Teacher Master Password:");
            if(pass === storedPass) { toggleTeacherDesk(); } 
            else if(pass !== null) { alert("❌ Incorrect password! Access denied."); }
        }

        function changeMasterPassword() {
            let currentPass = localStorage.getItem('bathysphere_master_pass');
            let verify = prompt("Enter your CURRENT master password:");
            if(verify === currentPass) {
                let nextPass = prompt("Enter your NEW master password:");
                if(nextPass && nextPass.trim() !== "") {
                    localStorage.setItem('bathysphere_master_pass', nextPass.trim());
                    alert("✓ Master password updated successfully!");
                } else { alert("Password cannot be empty."); }
            } else if(verify !== null) { alert("❌ Incorrect current password!"); }
        }

        // 🤖 API-KEY-FREE AI MISSION GENERATOR
        // Text generation: Cloudflare Workers AI
        // Image/book-page OCR: Cloudflare Vision OCR
        // Optional station visuals: FLUX image generation
        // Teacher can edit every generated field afterward in the existing CMS.

        function fileToDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        async function compressGeneratedImage(dataUrl, maxSide = 480, quality = 0.78) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.naturalWidth || img.width;
                    let h = img.naturalHeight || img.height;
                    const scale = Math.min(1, maxSide / Math.max(w, h));
                    w = Math.max(1, Math.round(w * scale));
                    h = Math.max(1, Math.round(h * scale));
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d', { alpha: false });
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(dataUrl);
                img.src = dataUrl;
            });
        }

        let pdfJsLoadingPromise = null;

        async function ensurePdfJs() {
            if (window.pdfjsLib) return window.pdfjsLib;
            if (pdfJsLoadingPromise) return pdfJsLoadingPromise;

            pdfJsLoadingPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                    if (!window.pdfjsLib) {
                        reject(new Error('PDF reader could not initialize.'));
                        return;
                    }
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve(window.pdfjsLib);
                };
                script.onerror = () => reject(new Error('PDF reader could not load.'));
                document.head.appendChild(script);
            });
            return pdfJsLoadingPromise;
        }

        async function ocrImageDataUrl(dataUrl, status, label = 'Reading uploaded image...') {
            status.innerText = `👁️ ${label}`;
            const result = await callMissionAI('ocr', { image: dataUrl });
            const text = String(result.text || '').trim();
            if (!text) throw new Error('No readable text could be extracted from the uploaded image.');
            return text;
        }

        async function extractPdfSource(file, status) {
            const pdfjsLib = await ensurePdfJs();
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
            const MAX_DIGITAL_PAGES = Math.min(pdf.numPages, 20);
            let extracted = [];

            for (let p = 1; p <= MAX_DIGITAL_PAGES; p++) {
                status.innerText = `📄 Reading PDF text: page ${p}/${MAX_DIGITAL_PAGES}...`;
                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                const text = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
                if (text) extracted.push(text);
            }

            let combined = extracted.join('\n\n').trim();

            if (combined.length < 250) {
                const OCR_PAGES = Math.min(pdf.numPages, 6);
                const scanned = [];
                for (let p = 1; p <= OCR_PAGES; p++) {
                    status.innerText = `👁️ Scanned PDF detected — OCR page ${p}/${OCR_PAGES}...`;
                    const page = await pdf.getPage(p);
                    const viewport = page.getViewport({ scale: 1.35 });
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(viewport.width);
                    canvas.height = Math.round(viewport.height);
                    const ctx = canvas.getContext('2d', { alpha: false });
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
                    try {
                        const pageText = await ocrImageDataUrl(dataUrl, status, `AI OCR is reading scanned page ${p}/${OCR_PAGES}...`);
                        if (pageText) scanned.push(pageText);
                    } catch (err) {
                        console.warn(`PDF OCR page ${p} skipped:`, err);
                    }
                }
                combined = scanned.join('\n\n').trim();
            }

            if (!combined) throw new Error('No readable text was found in this PDF.');
            return combined;
        }

        async function readTeacherSourceFile(file, status) {
            if (!file) return '';
            const type = String(file.type || '').toLowerCase();
            const name = String(file.name || '').toLowerCase();
            if (type === 'application/pdf' || name.endsWith('.pdf')) return await extractPdfSource(file, status);
            if (type.startsWith('image/')) {
                const dataUrl = await fileToDataUrl(file);
                return await ocrImageDataUrl(dataUrl, status, 'AI is reading the book page / image...');
            }
            if (type === 'text/plain' || name.endsWith('.txt')) return await file.text();
            throw new Error('Supported uploads: PDF, image, or TXT.');
        }

        function mergeStationPackage(target, incoming) {
            if (!incoming || typeof incoming !== 'object') return;
            Object.entries(incoming).forEach(([id, station]) => {
                const n = Number(id);
                if (n >= 1 && n <= 30 && station && typeof station === 'object') {
                    target[String(n)] = station;
                }
            });
        }

        async function generateMissionWithAI() {
            const topicText = document.getElementById('aiTopicInput').value.trim();
            const fileInput = document.getElementById('aiDocFile');
            const outputMode = document.getElementById('aiOutputMode').value || 'text';

            const wantsVisuals = outputMode === 'visual' || outputMode === 'full';
            const wantsAudio = outputMode === 'audio' || outputMode === 'full';

            const file = fileInput.files && fileInput.files[0]
                ? fileInput.files[0]
                : null;

            if (!topicText && !file) {
                alert('Please paste lesson notes/objectives or upload a PDF/image/TXT source.');
                return;
            }

            const status = document.getElementById('aiLoadingStatus');
            const btn = document.getElementById('btnGenerateAI');
            status.style.display = 'block';
            btn.disabled = true;

            try {
                let documentText = '';
                if (file) {
                    documentText = await readTeacherSourceFile(file, status);
                }

                const sourceText = [
                    topicText ? `TEACHER NOTES / INSTRUCTIONS:\n${topicText}` : '',
                    documentText ? `UPLOADED SOURCE CONTENT:\n${documentText}` : ''
                ]
                    .filter(Boolean)
                    .join('\n\n')
                    .trim()
                    .slice(0, 30000);

                if (!sourceText) {
                    throw new Error('The source did not contain readable lesson content.');
                }

                // First build ONE coherent lesson blueprint.
                // This prevents each station mechanic from independently "guessing"
                // what the lesson is about.
                status.innerText = '🧭 Analyzing the lesson and building a coherent learning plan...';

                const planResult = await callMissionAI('mission_plan', {
                    sourceText
                });

                const missionPlan = planResult.plan || {};

                const generatedStations = {};
                const visualPlans = [];

                // Then turn that single blueprint into the six fixed game modules.
                for (let moduleNo = 1; moduleNo <= 6; moduleNo++) {
                    status.innerText =
                        `🧠 Building module ${moduleNo}/6 — stations ${(moduleNo - 1) * 5 + 1}-${moduleNo * 5}...`;

                    const result = await callMissionAI('mission_module', {
                        sourceText,
                        plan: missionPlan,
                        module: moduleNo,
                        visualMode: wantsVisuals
                    });

                    mergeStationPackage(
                        generatedStations,
                        result.stations || {}
                    );

                    if (Array.isArray(result.visuals)) {
                        visualPlans.push(...result.visuals);
                    }
                }

                const stationCount =
                    Object.keys(generatedStations).length;

                if (stationCount !== 30) {
                    throw new Error(
                        `AI produced ${stationCount}/30 stations. Please try Generate Mission once more.`
                    );
                }

                customEdited = generatedStations;

                // Smart visuals: select the highest-value suggestions only.
                if (wantsVisuals) {
                    const eligible = new Set([
                        1, 2, 3, 4, 5,
                        16, 17, 18, 19, 20,
                        21, 22, 23, 24, 25,
                        26, 27, 28, 29
                    ]);

                    const chosen = visualPlans
                        .filter(v =>
                            v &&
                            eligible.has(Number(v.stationId)) &&
                            String(v.prompt || '').trim()
                        )
                        .sort((a, b) =>
                            Number(b.priority || 0) -
                            Number(a.priority || 0)
                        )
                        .filter((v, i, arr) =>
                            arr.findIndex(x =>
                                Number(x.stationId) ===
                                Number(v.stationId)
                            ) === i
                        )
                        .slice(0, 10);

                    for (let i = 0; i < chosen.length; i++) {
                        const item = chosen[i];
                        const stationId =
                            String(Number(item.stationId));

                        status.innerText =
                            `🎨 Creating helpful visual ${i + 1}/${chosen.length} for station ${stationId}...`;

                        try {
                            const imgResult =
                                await callMissionAI('image', {
                                    prompt:
                                        String(item.prompt || '')
                                            .slice(0, 1500)
                                });

                            if (
                                imgResult.image &&
                                customEdited[stationId]
                            ) {
                                customEdited[stationId].customImg =
                                    await compressGeneratedImage(
                                        imgResult.image
                                    );
                            }
                        } catch (imgErr) {
                            console.warn(
                                `Visual for station ${stationId} skipped:`,
                                imgErr
                            );
                        }
                    }
                }

                // AI audio is generated only for the actual listening stations.
                // The transcript stays editable in Teacher Desk.
                if (wantsAudio) {
                    const listeningStations = [11, 12, 13, 14, 15];

                    for (let i = 0; i < listeningStations.length; i++) {
                        const stationId =
                            String(listeningStations[i]);

                        const station =
                            customEdited[stationId];

                        const transcript =
                            String(station?.trans || '').trim();

                        if (!transcript) continue;

                        status.innerText =
                            `🎙️ Creating listening audio ${i + 1}/${listeningStations.length} for station ${stationId}...`;

                        try {
                            const audioResult =
                                await callMissionAI('tts', {
                                    text: transcript
                                });

                            if (
                                audioResult.audio &&
                                customEdited[stationId]
                            ) {
                                customEdited[stationId].customAudio =
                                    audioResult.audio;
                            }
                        } catch (audioErr) {
                            console.warn(
                                `Audio for station ${stationId} skipped:`,
                                audioErr
                            );
                        }
                    }
                }

                localStorage.setItem(
                    'bathysphere_cms_custom',
                    JSON.stringify(customEdited)
                );

                status.innerText =
                    wantsVisuals && wantsAudio
                        ? '✅ Mission generated with AI audio and smart visuals!'
                        : wantsVisuals
                            ? '✅ Mission generated with smart visuals!'
                            : wantsAudio
                                ? '✅ Mission generated with AI audio!'
                                : '✅ Text mission generated!';

                populateStationDropdown();
                jumpTo(1);
                renderTeacherForm();

                setTimeout(() => {
                    status.style.display = 'none';
                }, 1400);

                alert(
                    '🎉 30 coherent stations generated. You can edit every question, accepted answer, transcript, image and audio file in Teacher Desk.'
                );

            } catch (err) {
                console.error(
                    'AI mission generation error:',
                    err
                );

                status.style.display = 'none';

                alert(
                    'AI Generation failed: ' +
                    err.message
                );

            } finally {
                btn.disabled = false;
            }
        }

        function startExpedition() {
            const name = document.getElementById('inputPilotName').value.trim();
            pilot.name = name || "Explorer Cadet";
            pilot.role = document.getElementById('selectPilotRole').value;
            pilot.feeling = document.getElementById('selectPilotFeeling').value;
            pilot.score = 0;
            pilot.visited = [];
            pilot.mistakes = [];

            document.getElementById('hudPilot').innerText = pilot.name;
            document.getElementById('hudRole').innerText = pilot.role;
            document.getElementById('hudScore').innerText = `${pilot.score} XP`;

            document.getElementById('briefingScreen').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';

            renderQuickNav();
            jumpTo(1);
        }

        function renderQuickNav() {
            const rows = { 1: 'rowM1', 2: 'rowM2', 3: 'rowM3', 4: 'rowM4', 5: 'rowM5', 6: 'rowM6' };
            for(let r in rows) document.getElementById(rows[r]).innerHTML = "";

            for(let i=1; i<=30; i++) {
                const modIdx = Math.ceil(i / 5);
                const btn = document.createElement('button');
                btn.className = `jump-btn ${i === currentGame ? 'active' : ''}`;
                btn.id = `btnJmp${i}`;
                const stationName = customModuleNames[i] || `Station ${i}`;
                btn.innerText = `${i}. ${stationName}`;
                btn.onclick = () => jumpTo(i);
                document.getElementById(rows[modIdx]).appendChild(btn);
            }
        }

        function jumpTo(n) {
            currentGame = n;
            if(!pilot.visited.includes(n)) pilot.visited.push(n);

            for(let i=1; i<=30; i++) {
                const b = document.getElementById(`btnJmp${i}`);
                if(b) b.classList.toggle('active', i === n);
                const g = document.getElementById(`game${i}`);
                if(g) g.style.display = 'none';
            }

            const data = getActiveStationData(n);
            document.getElementById('stagePrompt').innerText = data.prompt || "";
            document.getElementById('feedback').style.display = 'none';

            const mediaBox = document.getElementById('mediaBox');
            mediaBox.innerHTML = "";
            let hasMed = false;
            if(data.customImg) {
                const img = document.createElement('img');
                img.src = data.customImg;
                mediaBox.appendChild(img);
                hasMed = true;
            }
            if(data.customAudio) {
                const aud = document.createElement('audio');
                aud.controls = true;
                aud.src = data.customAudio;
                aud.style.width = "80%";
                mediaBox.appendChild(aud);
                hasMed = true;
            }
            mediaBox.style.display = hasMed ? "block" : "none";

            const stage = document.getElementById(`game${n}`);
            if(stage) stage.style.display = 'block';

            if(data.type === "fener") {
                document.getElementById('g1W1').innerText = (data.decoys && data.decoys[0]) || "RUDDER";
                document.getElementById('g1W1').onclick = () => recordMistakeAndFeedback(false, n);
                document.getElementById('g1W2').innerText = data.target || "PROPELLER";
                document.getElementById('g1W2').onclick = () => showFeedback(true, `✓ Target identified: '${data.target}' logged!`);
                document.getElementById('g1W3').innerText = (data.decoys && data.decoys[1]) || "ANCHOR";
                document.getElementById('g1W3').onclick = () => recordMistakeAndFeedback(false, n);
            }
            else if(data.type === "kablo") {
                document.getElementById('g2Source').innerText = data.source;
                const optBox = document.getElementById('g2Options');
                optBox.innerHTML = "";
                const all = [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5);
                all.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'opt-btn';
                    btn.innerText = `➔ ${opt}`;
                    btn.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    optBox.appendChild(btn);
                });
            }
            else if(data.type === "vana") {
                document.getElementById('valveWheel').innerText = (data.choices && data.choices[0]) || "LIFEBOAT";
            }
            else if(data.type === "kargo") {
                document.getElementById('g4Cargo').innerText = data.cargo;
                const optBox = document.getElementById('g4Options');
                optBox.innerHTML = "";
                const all = [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5);
                all.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'opt-btn';
                    btn.innerText = `➔ ${opt}`;
                    btn.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    optBox.appendChild(btn);
                });
            }
            else if(data.type === "mikroskop") {
                document.getElementById('microLens').innerText = data.label;
                const optBox = document.getElementById('g5Options');
                optBox.innerHTML = "";
                const all = [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5);
                all.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'opt-btn';
                    btn.innerText = opt;
                    btn.onclick = () => {
                        if(document.getElementById('microSlider').value == 0) {
                            if(opt === data.correct) showFeedback(true);
                            else recordMistakeAndFeedback(false, n);
                        } else alert("Calibrate optical slider to 0 first!");
                    };
                    optBox.appendChild(btn);
                });
            }
            else if(data.type === "boru") {
                initPipeGame(data.sentence);
            }
            else if(data.type === "periskop") {
                const box = document.getElementById('g8Bubbles');
                box.innerHTML = "";
                const list = [{ txt: data.correctErr, cor: true }, { txt: data.normals[0], cor: false }, { txt: data.normals[1], cor: false }].sort(() => Math.random() - 0.5);
                list.forEach(item => {
                    const b = document.createElement('div');
                    b.className = 'bubble-target';
                    b.innerText = `"${item.txt}"`;
                    b.onclick = () => {
                        if(item.cor) showFeedback(true, "✓ Direct hit! Flawed syntax eliminated.");
                        else recordMistakeAndFeedback(false, n, "Periscope: Wrong target selected.");
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "terazi") {
                document.getElementById('g9Subject').innerText = data.subject;
                const box = document.getElementById('g9Options');
                box.innerHTML = "";
                [data.correct, data.distractor].sort(() => Math.random() - 0.5).forEach(v => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = v;
                    b.onclick = () => {
                        document.getElementById('panVerbDisplay').innerText = v;
                        if(v === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n, "Scale: Subject-verb mismatch.");
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "mors") {
                document.getElementById('g10Prompt').innerText = data.text;
                const box = document.getElementById('g10Options');
                box.innerHTML = "";
                [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5).forEach(opt => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = opt;
                    b.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "ses_sik") {
                const aud = document.getElementById(`audioG${n}`);
                if(aud) aud.src = data.customAudio || "";
                document.getElementById(`g${n}Trans`).innerText = `Transcript: ${data.trans || "Listen to audio."}`;
                const box = document.getElementById(`g${n}Options`);
                box.innerHTML = "";
                [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5).forEach(opt => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = opt;
                    b.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "salter") {
                const aud = document.getElementById(`audioG15`);
                if(aud) aud.src = data.customAudio || "";
                document.getElementById('g15Trans').innerText = `Instruction: ${data.trans}`;
                initSwitches(data.order);
            }
            else if(data.type === "uv") {
                document.getElementById('uvText').innerText = `"${data.text}"`;
                const box = document.getElementById('g16Options');
                box.innerHTML = "";
                [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5).forEach(opt => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = opt;
                    b.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "okuma_sik") {
                const logEl = document.getElementById(`g${n}Log`) || document.getElementById(`g${n}Desc`) || document.getElementById(`g${n}Text`);
                if(logEl) logEl.innerText = data.log || "";
                const box = document.getElementById(`g${n}Options`);
                box.innerHTML = "";
                [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5).forEach(opt => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = opt;
                    b.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "tablo") {
                document.getElementById('g20Table').innerText = data.tableHtml;
                const box = document.getElementById('g20Options');
                box.innerHTML = "";
                [data.correct, ...(data.distractors || [])].sort(() => Math.random() - 0.5).forEach(opt => {
                    const b = document.createElement('button');
                    b.className = 'opt-btn';
                    b.innerText = opt;
                    b.onclick = () => {
                        if(opt === data.correct) showFeedback(true);
                        else recordMistakeAndFeedback(false, n);
                    };
                    box.appendChild(b);
                });
            }
            else if(data.type === "yazma") {
                document.getElementById(`g${n}Hint`).innerText = data.hint;
                document.getElementById(`g${n}Display`).innerText = data.display;
                document.getElementById(`inputGame${n}`).value = "";
            }
            else if(data.type === "final") {
                document.getElementById('g30Title').innerText = data.title;
                document.getElementById('g30Desc').innerText = data.desc;
            }
        }

        function prevGame() { if(currentGame > 1) jumpTo(currentGame - 1); }
        function nextGame() { if(currentGame < 30) jumpTo(currentGame + 1); }

        function showFeedback(isCor, msg) {
            const fb = document.getElementById('feedback');
            fb.style.display = 'block';
            if(isCor) {
                pilot.score += 20;
                document.getElementById('hudScore').innerText = `${pilot.score} XP`;
                fb.style.background = "rgba(0, 245, 212, 0.2)";
                fb.style.color = "var(--success-neon)";
                fb.innerText = msg || "✓ Correct! Good job.";
            } else {
                fb.style.background = "rgba(255, 0, 85, 0.2)";
                fb.style.color = "var(--danger-neon)";
                fb.innerText = msg || "✕ Incorrect. Try again.";
            }
        }

        function recordMistakeAndFeedback(isCor, stationId, customMsg) {
            if(!pilot.mistakes.includes(stationId)) pilot.mistakes.push(stationId);
            showFeedback(isCor, customMsg);
        }

        function normalizeStudentAnswer(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[’']/g, "'")
                .replace(/[.,!?;:"()[\]{}]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function isAcceptableWritingAnswer(studentValue, acceptedAnswers) {
            const student = normalizeStudentAnswer(studentValue);
            if (!student) return false;

            const optionalTailStarters = new Set([
                'with', 'in', 'at', 'on', 'for',
                'after', 'before', 'during', 'because',
                'yesterday', 'today', 'last'
            ]);

            for (const rawAnswer of acceptedAnswers) {
                const answer = normalizeStudentAnswer(rawAnswer);
                if (!answer) continue;

                // Normal exact match, ignoring case and punctuation.
                if (student === answer) return true;

                const s = student.split(' ');
                const a = answer.split(' ');

                // Example:
                // expected: "I played soccer with friends"
                // learner:  "I played soccer"
                // Accept only when the omitted part begins with an obviously
                // optional detail marker. This is intentionally conservative.
                if (
                    s.length >= 3 &&
                    a.length > s.length &&
                    a.slice(0, s.length).join(' ') === student &&
                    optionalTailStarters.has(a[s.length])
                ) {
                    return true;
                }

                // Also allow the learner to ADD an optional detail to a shorter
                // accepted core answer.
                if (
                    a.length >= 3 &&
                    s.length > a.length &&
                    s.slice(0, a.length).join(' ') === answer &&
                    optionalTailStarters.has(s[a.length])
                ) {
                    return true;
                }
            }

            return false;
        }

        function checkWriting(n) {
            const val =
                document.getElementById(`inputGame${n}`).value.trim();

            const data =
                getActiveStationData(n);

            const accepted =
                String(data.answers || "")
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);

            if (isAcceptableWritingAnswer(val, accepted)) {
                showFeedback(
                    true,
                    `✓ Accepted: '${val}'`
                );
            } else {
                if (!pilot.mistakes.includes(n)) {
                    pilot.mistakes.push(n);
                }

                showFeedback(
                    false,
                    `✕ Not accepted yet: '${val || "Empty"}'. Check the language or try another valid form.`
                );
            }
        }

        function openReflectionModal() {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('debriefScreen').style.display = 'block';
            document.getElementById('reflectionBox').style.display = 'block';
            document.getElementById('certificateContainer').style.display = 'none';
        }

        function generateCertificate() {
            pilot.postFeeling = document.getElementById('selectPostFeeling').value;
            pilot.keyTakeaway = document.getElementById('inputKeyTakeaway').value.trim() || "Completed all core stations.";

            saveStudentLog();

            document.getElementById('certPilotName').innerText = pilot.name;
            document.getElementById('certRole').innerText = pilot.role;
            document.getElementById('certScore').innerText = `${pilot.score} XP`;
            
            const certBody = document.getElementById('certBodyText');
            if(pilot.score >= 400) {
                certBody.innerText = `For successfully completing the deep sea mission with a score of ${pilot.score} XP and showing great understanding!`;
            } else if(pilot.score > 0) {
                certBody.innerText = `For participating in the deep sea mission and scoring ${pilot.score} XP. Keep practicing to improve your skills!`;
            } else {
                certBody.innerText = `Certificate of Attendance. Scored 0 XP. Mission was submitted without completing questions.`;
            }

            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('certDate').innerText = dateStr;

            document.getElementById('certReflectNote').innerText = `${pilot.postFeeling} - "${pilot.keyTakeaway}"`;

            document.getElementById('reflectionBox').style.display = 'none';
            document.getElementById('certificateContainer').style.display = 'block';
        }

        function saveStudentLog() {
            const today = new Date().toLocaleString('en-US');
            let diagnostic = "";
            const totalIssues = pilot.mistakes.length;

            if(pilot.score === 0) { diagnostic = "⚠️ Critical: Student scored 0 XP and completed mission without answers."; } 
            else if(totalIssues === 0 && pilot.score >= 500) { diagnostic = "🏆 Excellent Performance: Completed all stations without any errors."; } 
            else { diagnostic = `⚠️ Growth Area: Errors recorded in ${totalIssues} stations. Review recommended.`; }

            const record = {
                id: Date.now(),
                date: today,
                name: pilot.name,
                role: pilot.role,
                score: `${pilot.score} XP`,
                mistakes: totalIssues > 0 ? pilot.mistakes.join(', ') : "None",
                diagnostic: diagnostic
            };

            studentLogs.unshift(record);
            localStorage.setItem('bathysphere_student_logs', JSON.stringify(studentLogs));
        }

        function restartExpedition() {
            document.getElementById('debriefScreen').style.display = 'none';
            document.getElementById('briefingScreen').style.display = 'block';
        }

        function moveFener(e) {
            const rect = document.getElementById('fenerArea').getBoundingClientRect();
            document.getElementById('darkMask').style.background = `radial-gradient(circle 75px at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, transparent 0%, #030813 100%)`;
        }
        function rotateValve(val) {
            document.getElementById('valveWheel').style.transform = `rotate(${val}deg)`;
            const data = getActiveStationData(3);
            let txt = (data.choices && data.choices[0]) || "LIFEBOAT";
            if(val > 120 && val < 240) txt = (data.choices && data.choices[1]) || "SUBMARINE";
            if(val >= 240) txt = (data.choices && data.choices[2]) || "SONDE";
            document.getElementById('valveWheel').innerText = txt;
        }
        function checkValve() {
            const val = document.getElementById('valveSlider').value;
            const data = getActiveStationData(3);
            const isCor = (val > 120 && val < 240);
            if(isCor) showFeedback(true, `✓ Valve Locked: '${data.targetVal}' pressure equalized!`);
            else recordMistakeAndFeedback(false, 3, "Valve: Wrong pressure level.");
        }
        function adjustFocus(val) { document.getElementById('microLens').style.filter = `blur(${val}px)`; }

        let userPipe = [];
        let targetSentenceWords = [];
        function initPipeGame(sentenceStr) {
            userPipe = [];
            targetSentenceWords = (sentenceStr || "The,submarine,is,diving").split(',').map(s => s.trim());
            document.getElementById('pipeLine').innerHTML = '<span style="color:#64748b;" id="pipePlaceholder">Place capsules into pipe sequentially...</span>';
            const pool = document.getElementById('capsulesPool');
            pool.innerHTML = "";
            [...targetSentenceWords].sort(() => Math.random() - 0.5).forEach(w => {
                const c = document.createElement('div');
                c.className = 'capsule';
                c.innerText = w;
                c.onclick = () => {
                    userPipe.push(w);
                    c.style.display = 'none';
                    document.getElementById('pipePlaceholder').style.display = 'none';
                    const cap = document.createElement('div');
                    cap.className = 'capsule';
                    cap.innerText = w;
                    document.getElementById('pipeLine').appendChild(cap);
                };
                pool.appendChild(c);
            });
        }
        function resetPipe() { initPipeGame(getActiveStationData(6).sentence); }
        function checkPipeAssembly() {
            const isMatch = JSON.stringify(userPipe) === JSON.stringify(targetSentenceWords);
            if(isMatch) showFeedback(true, "✓ Line sealed: Syntax arrangement correct!");
            else recordMistakeAndFeedback(false, 6, "Pipe: Word order incorrect.");
        }

        let curFreq = 90;
        function tuneRadio(v) {
            curFreq = v;
            document.getElementById('freqLabel').innerText = `${v}.0 MHz`;
            const st = document.getElementById('freqStatus');
            const target = getActiveStationData(7).targetFreq || 120;
            if(Math.abs(v - target) <= 2) {
                st.innerText = "⚡ CLEAN SIGNAL: Waveband Locked!";
                st.style.color = "var(--success-neon)";
            } else {
                st.innerText = `Static Interference: Tune near ${target}.0 MHz`;
                st.style.color = "#94a3b8";
            }
        }
        function checkRadioFreq() {
            const target = getActiveStationData(7).targetFreq || 120;
            const isCor = Math.abs(curFreq - target) <= 2;
            if(isCor) showFeedback(true, "✓ Frequency locked successfully!");
            else recordMistakeAndFeedback(false, 7, "Radio: Wrong waveband.");
        }

        let userSwitches = [];
        let targetSwitchOrder = [];
        function initSwitches(orderStr) {
            userSwitches = [];
            targetSwitchOrder = (orderStr || "Vent,Power,Seal").split(',').map(s => s.trim());
            const box = document.getElementById('g15Switches');
            box.innerHTML = "";
            targetSwitchOrder.forEach((name, i) => {
                const u = document.createElement('div');
                u.className = 'switch-unit';
                u.innerHTML = `<div class="switch-lever" id="sw_${name}" onclick="pullSwitch('${name}')"><div class="switch-handle"></div></div><span style="font-size:0.75rem; font-weight:bold;">${i+1}. ${name.toUpperCase()}</span>`;
                box.appendChild(u);
            });
        }
        function pullSwitch(name) {
            if(userSwitches.includes(name)) return;
            userSwitches.push(name);
            const el = document.getElementById(`sw_${name}`);
            if(el) el.classList.add('active');
            if(userSwitches.length === targetSwitchOrder.length) {
                const isMatch = JSON.stringify(userSwitches) === JSON.stringify(targetSwitchOrder);
                if(isMatch) showFeedback(true, "✓ Sequential protocol locked successfully!");
                else recordMistakeAndFeedback(false, 15, "Switches: Wrong order.");
            }
        }
        function resetSwitches() {
            userSwitches = [];
            targetSwitchOrder.forEach(name => {
                const el = document.getElementById(`sw_${name}`);
                if(el) el.classList.remove('active');
            });
        }

        function moveUV(e) {
            const rect = document.getElementById('uvChamber').getBoundingClientRect();
            const overlay = document.getElementById('uvOverlay');
            overlay.style.display = 'block';
            overlay.style.left = `${e.clientX - rect.left}px`;
            overlay.style.top = `${e.clientY - rect.top}px`;
            const txt = document.getElementById('uvText');
            txt.style.color = "var(--uv-glow)";
            txt.style.textShadow = "0 0 15px var(--uv-glow)";
        }
        function hideUV() {
            document.getElementById('uvOverlay').style.display = 'none';
            const txt = document.getElementById('uvText');
            txt.style.color = "rgba(189, 0, 255, 0.08)";
            txt.style.textShadow = "none";
        }

        function toggleTeacherDesk() {
            const desk = document.getElementById('teacherDesk');
            desk.style.display = desk.style.display === 'block' ? 'none' : 'block';
            if(desk.style.display === 'block') {
                const savedKey = localStorage.getItem('bathysphere_gemini_key');
                if(savedKey) document.getElementById('geminiApiKey').value = savedKey;
                populateStationDropdown();
                renderTeacherForm();
                renderAnalyticsTable();
            }
        }

        function renderAnalyticsTable() {
            const table = document.getElementById('analyticsTable');
            table.innerHTML = `<tr><th>Date</th><th>Student Name</th><th>Role</th><th>Score</th><th>Incorrect/Missed Stations</th><th>AI Diagnostic Report</th><th>Action</th></tr>`;
            studentLogs.forEach((log, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${log.date}</td><td>${log.name}</td><td>${log.role}</td>
                    <td style="color:var(--success-neon); font-weight:bold;">${log.score}</td>
                    <td>${log.mistakes}</td><td style="color:var(--gold-glow);">${log.diagnostic}</td>
                    <td><button class="del-log-btn" onclick="deleteSingleLog(${index})">Delete ❌</button></td>
                `;
                table.appendChild(row);
            });
        }

        function deleteSingleLog(index) {
            if(confirm("Delete this student log?")) {
                studentLogs.splice(index, 1);
                localStorage.setItem('bathysphere_student_logs', JSON.stringify(studentLogs));
                renderAnalyticsTable();
            }
        }

        function clearAllStudentLogs() {
            if(confirm("Permanently clear all student logs?")) {
                studentLogs = [];
                localStorage.removeItem('bathysphere_student_logs');
                renderAnalyticsTable();
                alert("All logs cleared!");
            }
        }

        function exportStudentLogsCSV() {
            if(studentLogs.length === 0) { alert("No student data recorded yet."); return; }
            let csv = "Date,Student Name,Role,Score,Incorrect Stations,AI Diagnostic Report\n";
            studentLogs.forEach(l => { csv += `"${l.date}","${l.name}","${l.role}","${l.score}","${l.mistakes}","${l.diagnostic}"\n`; });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = "student_analytics_report.csv";
            document.body.appendChild(a); a.click(); a.remove();
        }

        function populateStationDropdown() {
            const sel = document.getElementById('admStationSelect');
            sel.innerHTML = "";
            for(let i=1; i<=30; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                const d = getActiveStationData(i);
                opt.innerText = `Station ${i} - ${(d.prompt || "").substring(0, 45)}...`;
                sel.appendChild(opt);
            }
            sel.value = currentGame;
        }

        let tempImg = ""; let tempAudio = "";

        function renderTeacherForm() {
            const id = document.getElementById('admStationSelect').value;
            const def = defaultStations[id];
            const cust = customEdited[id] || {};
            const container = document.getElementById('teacherDynamicFields');
            container.innerHTML = "";

            tempImg = cust.customImg || ""; tempAudio = cust.customAudio || "";
            addFormField(container, "Mission Prompt / Question:", "text", "adm_prompt", cust.prompt, def.prompt);

            if(def.type === "fener") {
                addFormField(container, "Target Keyword:", "text", "adm_target", cust.target, def.target);
                addFormField(container, "Decoy Words (Comma-separated):", "text", "adm_decoys", cust.decoys ? cust.decoys.join(', ') : "", (def.decoys || []).join(', '));
            }
            else if(def.type === "kablo" || def.type === "kargo") {
                addFormField(container, "Source Cable / Cargo Label:", "text", "adm_source", cust.source || cust.cargo, def.source || def.cargo);
                addFormField(container, "Correct Terminal / Department:", "text", "adm_correct", cust.correct, def.correct);
                addFormField(container, "Incorrect Distractors (Comma-separated):", "text", "adm_distractors", cust.distractors ? cust.distractors.join(', ') : "", (def.distractors || []).join(', '));
            }
            else if(def.type === "vana") {
                addFormField(container, "Target Keyword to Lock:", "text", "adm_targetVal", cust.targetVal, def.targetVal);
                addFormField(container, "Gauge Choices (3 words comma-separated):", "text", "adm_choices", cust.choices ? cust.choices.join(', ') : "", (def.choices || []).join(', '));
            }
            else if(def.type === "mikroskop") {
                addFormField(container, "Lens Specimen Label:", "text", "adm_label", cust.label, def.label);
                addFormField(container, "Correct Definition:", "text", "adm_correct", cust.correct, def.correct);
                addFormField(container, "Incorrect Distractors (Comma-separated):", "text", "adm_distractors", cust.distractors ? cust.distractors.join(', ') : "", (def.distractors || []).join(', '));
            }
            else if(def.type === "boru") {
                addFormField(container, "Target Sentence (Comma-separated words):", "text", "adm_sentence", cust.sentence, def.sentence);
            }
            else if(def.type === "radyo") {
                addFormField(container, "Target Frequency (MHz):", "number", "adm_targetFreq", cust.targetFreq, def.targetFreq);
            }
            else if(def.type === "periskop") {
                addFormField(container, "Flawed Sentence to Eliminate:", "text", "adm_correctErr", cust.correctErr, def.correctErr);
                addFormField(container, "Normal Sentences (2 items comma-separated):", "text", "adm_normals", cust.normals ? cust.normals.join(', ') : "", (def.normals || []).join(', '));
            }
            else if(def.type === "terazi") {
                addFormField(container, "Scale Subject (Left Pan):", "text", "adm_subject", cust.subject, def.subject);
                addFormField(container, "Correct Verb:", "text", "adm_correct", cust.correct, def.correct);
                addFormField(container, "Incorrect Verb Distractor:", "text", "adm_distractor", cust.distractor, def.distractor);
            }
            else if(def.type === "mors" || def.type === "ses_sik" || def.type === "okuma_sik" || def.type === "tablo" || def.type === "uv") {
                if(def.log !== undefined) addFormField(container, "Reading Log / Captain's Note:", "textarea", "adm_log", cust.log, def.log);
                if(def.text !== undefined) addFormField(container, "Display Text:", "textarea", "adm_text", cust.text, def.text);
                if(def.tableHtml !== undefined) addFormField(container, "Telemetry Table Text:", "text", "adm_tableHtml", cust.tableHtml, def.tableHtml);
                if(def.trans !== undefined) addFormField(container, "Audio Transcript / Hint:", "text", "adm_trans", cust.trans, def.trans);
                addFormField(container, "Correct Option:", "text", "adm_correct", cust.correct, def.correct);
                addFormField(container, "Incorrect Options (Comma-separated):", "text", "adm_distractors", cust.distractors ? cust.distractors.join(', ') : "", (def.distractors || []).join(', '));
            }
            else if(def.type === "salter") {
                addFormField(container, "Audio Transcript / Instruction:", "text", "adm_trans", cust.trans, def.trans);
                addFormField(container, "Lever Sequence Order (Comma-separated):", "text", "adm_order", cust.order, def.order);
            }
            else if(def.type === "yazma") {
                addFormField(container, "Writing Hint / Category:", "text", "adm_hint", cust.hint, def.hint);
                addFormField(container, "Display Prompt / Indicator:", "text", "adm_display", cust.display, def.display);
                addFormField(container, "Accepted Answers (Comma-separated):", "text", "adm_answers", cust.answers, def.answers);
            }
            else if(def.type === "final") {
                addFormField(container, "Final Header Title:", "text", "adm_title", cust.title, def.title);
                addFormField(container, "Final Success Description:", "textarea", "adm_desc", cust.desc, def.desc);
            }

            addMediaField(container, "Upload Custom Image (JPG/PNG):", "image/*", (b64) => { tempImg = b64; }, cust.customImg || def.customImg);
            addMediaField(container, "Upload Custom Audio (MP3/WAV):", "audio/*", (b64) => { tempAudio = b64; }, cust.customAudio || def.customAudio);

            if(def.type === "ses_sik" || def.type === "salter") {
                const audioGrp = document.createElement('div');
                audioGrp.className = 'teacher-group';
                audioGrp.innerHTML = `
                    <label>AI Audio from Editable Transcript</label>
                    <button type="button" class="hud-btn" onclick="regenerateStationAudio()" style="width:100%;">
                        🎙️ Regenerate Audio from Transcript
                    </button>
                    <div style="font-size:0.72rem; color:#64748b;">
                        Edit the transcript above first, then regenerate. Click Save & Deploy Station afterward.
                    </div>
                `;
                container.appendChild(audioGrp);
            }
        }

        async function regenerateStationAudio() {
            const id = document.getElementById('admStationSelect').value;
            const transEl = document.getElementById('adm_trans');
            const transcript = transEl ? transEl.value.trim() : '';

            if(!transcript) {
                alert('Write or edit the transcript first.');
                return;
            }

            try {
                const btn = event?.target;
                if(btn) {
                    btn.disabled = true;
                    btn.innerText = '🎙️ Generating audio...';
                }

                const result = await callMissionAI('tts', {
                    text: transcript
                });

                if(!result.audio) {
                    throw new Error('No audio was returned.');
                }

                tempAudio = result.audio;

                alert('✓ New AI audio is ready. Click Save & Deploy Station to keep it.');

                if(btn) {
                    btn.disabled = false;
                    btn.innerText = '🎙️ Regenerate Audio from Transcript';
                }
            } catch(err) {
                alert('Audio generation failed: ' + err.message);
                renderTeacherForm();
            }
        }

        function addFormField(container, labelText, type, id, userVal, placeholderVal) {
            const grp = document.createElement('div');
            grp.className = 'teacher-group';
            grp.innerHTML = `<label>${labelText}</label>`;
            let input;
            if(type === "textarea") {
                input = document.createElement('textarea');
                input.value = userVal !== undefined ? userVal : "";
                input.placeholder = `e.g. ${placeholderVal || ""}`;
            } else {
                input = document.createElement('input');
                input.type = type;
                input.value = userVal !== undefined ? userVal : "";
                input.placeholder = `e.g. ${placeholderVal || ""}`;
            }
            input.id = id;
            grp.appendChild(input);
            container.appendChild(grp);
        }

        function addMediaField(container, labelText, accept, callback, existing) {
            const grp = document.createElement('div');
            grp.className = 'teacher-group';
            grp.innerHTML = `<label>${labelText} ${existing ? '✓ (Loaded)' : ''}</label><input type="file" accept="${accept}">`;
            grp.querySelector('input').onchange = (e) => {
                const file = e.target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => callback(ev.target.result);
                    reader.readAsDataURL(file);
                }
            };
            container.appendChild(grp);
        }

        function clearCurrentFormInputs() {
            const container = document.getElementById('teacherDynamicFields');
            container.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => el.value = "");
            tempImg = ""; tempAudio = "";
            alert("Fields cleared!");
        }

        function saveCurrentStation() {
            const id = document.getElementById('admStationSelect').value;
            const def = defaultStations[id];
            const data = {};
            const promptVal = document.getElementById('adm_prompt').value.trim();
            if(promptVal) data.prompt = promptVal;
            if(tempImg) data.customImg = tempImg;
            if(tempAudio) data.customAudio = tempAudio;

            if(def.type === "fener") {
                const t = document.getElementById('adm_target').value.trim();
                const d = document.getElementById('adm_decoys').value.trim();
                if(t) data.target = t;
                if(d) data.decoys = d.split(',').map(s => s.trim());
            }
            else if(def.type === "kablo" || def.type === "kargo") {
                const s = document.getElementById('adm_source').value.trim();
                const c = document.getElementById('adm_correct').value.trim();
                const dis = document.getElementById('adm_distractors').value.trim();
                if(s) { if(def.source) data.source = s; else data.cargo = s; }
                if(c) data.correct = c;
                if(dis) data.distractors = dis.split(',').map(x => x.trim());
            }
            else if(def.type === "vana") {
                const t = document.getElementById('adm_targetVal').value.trim();
                const ch = document.getElementById('adm_choices').value.trim();
                if(t) data.targetVal = t;
                if(ch) data.choices = ch.split(',').map(x => x.trim());
            }
            else if(def.type === "mikroskop") {
                const l = document.getElementById('adm_label').value.trim();
                const c = document.getElementById('adm_correct').value.trim();
                const dis = document.getElementById('adm_distractors').value.trim();
                if(l) data.label = l;
                if(c) data.correct = c;
                if(dis) data.distractors = dis.split(',').map(x => x.trim());
            }
            else if(def.type === "boru") {
                const sent = document.getElementById('adm_sentence').value.trim();
                if(sent) data.sentence = sent;
            }
            else if(def.type === "radyo") {
                const rf = document.getElementById('adm_targetFreq').value.trim();
                if(rf) data.targetFreq = parseInt(rf);
            }
            else if(def.type === "periskop") {
                const err = document.getElementById('adm_correctErr').value.trim();
                const norm = document.getElementById('adm_normals').value.trim();
                if(err) data.correctErr = err;
                if(norm) data.normals = norm.split(',').map(x => x.trim());
            }
            else if(def.type === "terazi") {
                const sub = document.getElementById('adm_subject').value.trim();
                const cor = document.getElementById('adm_correct').value.trim();
                const dis = document.getElementById('adm_distractor').value.trim();
                if(sub) data.subject = sub;
                if(cor) data.correct = cor;
                if(dis) data.distractor = dis;
            }
            else if(def.type === "mors" || def.type === "ses_sik" || def.type === "okuma_sik" || def.type === "tablo" || def.type === "uv") {
                if(document.getElementById('adm_log')) { const v = document.getElementById('adm_log').value.trim(); if(v) data.log = v; }
                if(document.getElementById('adm_text')) { const v = document.getElementById('adm_text').value.trim(); if(v) data.text = v; }
                if(document.getElementById('adm_tableHtml')) { const v = document.getElementById('adm_tableHtml').value.trim(); if(v) data.tableHtml = v; }
                if(document.getElementById('adm_trans')) { const v = document.getElementById('adm_trans').value.trim(); if(v) data.trans = v; }
                const c = document.getElementById('adm_correct').value.trim();
                const dis = document.getElementById('adm_distractors').value.trim();
                if(c) data.correct = c;
                if(dis) data.distractors = dis.split(',').map(x => x.trim());
            }
            else if(def.type === "salter") {
                const tr = document.getElementById('adm_trans').value.trim();
                const ord = document.getElementById('adm_order').value.trim();
                if(tr) data.trans = tr;
                if(ord) data.order = ord;
            }
            else if(def.type === "yazma") {
                const h = document.getElementById('adm_hint').value.trim();
                const d = document.getElementById('adm_display').value.trim();
                const a = document.getElementById('adm_answers').value.trim();
                if(h) data.hint = h;
                if(d) data.display = d;
                if(a) data.answers = a;
            }
            else if(def.type === "final") {
                const t = document.getElementById('adm_title').value.trim();
                const ds = document.getElementById('adm_desc').value.trim();
                if(t) data.title = t;
                if(ds) data.desc = ds;
            }

            customEdited[id] = data;
            localStorage.setItem('bathysphere_cms_custom', JSON.stringify(customEdited));
            alert(`Station ${id} successfully updated!`);
            jumpTo(id);
        }

        function exportJSON() {
            const fullExport = {};
            for(let i=1; i<=30; i++) fullExport[i] = getActiveStationData(i);
            const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullExport, null, 2));
            const a = document.createElement('a');
            a.href = str; a.download = "bathysphere_lesson_package.json";
            document.body.appendChild(a); a.click(); a.remove();
        }

        function importJSON(e) {
            const f = e.target.files[0];
            if(f) {
                const r = new FileReader();
                r.onload = (ev) => {
                    try {
                        customEdited = JSON.parse(ev.target.result);
                        localStorage.setItem('bathysphere_cms_custom', JSON.stringify(customEdited));
                        alert("Lesson package imported successfully!");
                        jumpTo(currentGame); renderTeacherForm();
                    } catch(err) { alert("Invalid JSON file!"); }
                };
                r.readAsText(f);
            }
        }

        function resetToFactoryDefaults() {
            if(confirm("Reset all stations to factory defaults?")) {
                localStorage.removeItem('bathysphere_cms_custom');
                customEdited = {};
                alert("Reset complete!");
                jumpTo(1); renderTeacherForm();
            }
        }
    </script>
</body>
</html>
