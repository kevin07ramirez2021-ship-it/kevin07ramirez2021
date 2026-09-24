class SoundEngine {
    constructor() { this.ctx = null; }
    init() { if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } }
    playCorrect() {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
    }
    playWrong() {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
    }
    playMove() {
        this.init(); const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
}
const audio = new SoundEngine();

class MultiplayerSyncManager {
    constructor() {
        this.channel = new BroadcastChannel('math_game_multiplayer_sync');
        this.listeners = [];
        this.channel.onmessage = (event) => { this.listeners.forEach(callback => callback(event.data)); };
    }
    subscribe(callback) { this.listeners.push(callback); }
    broadcast(type, payload) {
        this.channel.postMessage({ type: type, payload: payload, timestamp: Date.now() });
    }
}
const syncManager = new MultiplayerSyncManager();

const MAP_CONFIG = { startX: 90, nodeSpacingX: 130, trackY: [150, 300, 450], questionsPerLevel: 3 };

const TOPICS_LEVEL_1 = [
    { id: 'geo', name: 'Geometría Básica', icon: '📐', track: 0 },
    { id: 'alg', name: 'Álgebra Intro', icon: '🧮', track: 1 },
    { id: 'num', name: 'Op. Numéricas', icon: '➕', track: 2 }
];

const TOPICS_LEVEL_2 = [
    { id: 'func', name: 'Funciones', icon: '📈', track: 0 },
    { id: 'frac', name: 'Núm. Racionales', icon: '🔢', track: 1 },
    { id: 'log', name: 'Lógica Mat.', icon: '🧩', track: 2 }
];

const QUESTION_BANK = {
    geo: [
        { q: "¿Cuánto suma la suma de ángulos internos de un triángulo?", opts: ["180°", "360°", "90°"], ans: 0 },
        { q: "¿Qué fórmula calcula el área de un círculo?", opts: ["2 · π · r", "π · r²", "π · d"], ans: 1 },
        { q: "¿Un triángulo con tres lados iguales se denomina?", opts: ["Isósceles", "Escaleno", "Equilátero"], ans: 2 }
    ],
    alg: [
        { q: "Si 2x + 4 = 10, ¿cuál es el valor de x?", opts: ["2", "3", "4"], ans: 1 },
        { q: "Simplifica la expresión: 3a + 5a - 2a", opts: ["6a", "8a", "10a"], ans: 0 },
        { q: "¿Cuál es el desarrollo del binomio (x + 2)²?", opts: ["x² + 4", "x² + 4x + 4", "x² + 2x + 4"], ans: 1 }
    ],
    num: [
        { q: "¿Cuál es el resultado de (-5) × (-4)?", opts: ["-20", "20", "-9"], ans: 1 },
        { q: "Calcula el valor exacto de √144", opts: ["11", "12", "14"], ans: 1 },
        { q: "¿Cuánto representa el 15% de 200?", opts: ["30", "25", "35"], ans: 0 }
    ],
    func: [
        { q: "En la función f(x) = 3x - 1, ¿cuánto vale f(2)?", opts: ["4", "5", "6"], ans: 1 },
        { q: "¿Qué indica la pendiente 'm' en la recta f(x) = mx + b?", opts: ["Corte con eje Y", "Inclinación de la recta", "Dominio"], ans: 1 },
        { q: "La representación gráfica de una función cuadrática es:", opts: ["Una recta", "Una parábola", "Una curva cúbica"], ans: 1 }
    ],
    frac: [
        { q: "Simplifica la fracción 8/12 a su forma irreducible:", opts: ["2/3", "4/6", "3/4"], ans: 0 },
        { q: "Resuelve la suma de fracciones: 1/4 + 2/4", opts: ["3/8", "3/4", "1/2"], ans: 1 },
        { q: "¿A qué número decimal equivale la fracción 3/5?", opts: ["0.5", "0.6", "0.75"], ans: 1 }
    ],
    log: [
        { q: "Si P es Verdadero y Q es Falso, la conjunción (P ∧ Q) es:", opts: ["Verdadera", "Falsa"], ans: 1 },
        { q: "Continúa la secuencia lógica: 2, 4, 8, 16, ...", opts: ["24", "32", "64"], ans: 1 },
        { q: "Si todo A es B y todo B es C, se concluye lógicamente que:", opts: ["Todo A es C", "Ningún A es C", "Todo C es A"], ans: 0 }
    ]
};

let GraphNodes = []; let GraphEdges = [];
let localPlayer = { id: null, name: "", color: "#e53e3e", currentNodeId: "start", completedNodes: ["start"], progressPercent: 0, selectedBranchL1: null, selectedBranchL2: null, penaltyEndTime: 0 };
let penaltyTimerInterval = null; let connectedRealPlayers = {};

function buildGraphStructure() {
    GraphNodes = []; GraphEdges = []; let currentX = MAP_CONFIG.startX;
    GraphNodes.push({ id: 'start', type: 'start', label: 'Inicio', icon: '🏠', x: currentX, y: MAP_CONFIG.trackY[1] });

    currentX += MAP_CONFIG.nodeSpacingX;
    TOPICS_LEVEL_1.forEach(topic => {
        const topicNodeId = `l1_t_${topic.id}`;
        GraphNodes.push({ id: topicNodeId, type: 'topic', label: topic.name, icon: topic.icon, x: currentX, y: MAP_CONFIG.trackY[topic.track], topicKey: topic.id, level: 1 });
        GraphEdges.push({ from: 'start', to: topicNodeId });
        let qX = currentX; let prevId = topicNodeId;
        for (let i = 1; i <= MAP_CONFIG.questionsPerLevel; i++) {
            qX += MAP_CONFIG.nodeSpacingX;
            const qId = `l1_q_${topic.id}_${i}`;
            GraphNodes.push({ id: qId, type: 'question', label: `P${i}`, icon: `${i}`, x: qX, y: MAP_CONFIG.trackY[topic.track], topicKey: topic.id, qIndex: i - 1, level: 1 });
            GraphEdges.push({ from: prevId, to: qId });
            prevId = qId;
        }
    });

    currentX += (MAP_CONFIG.questionsPerLevel + 1.2) * MAP_CONFIG.nodeSpacingX;
    TOPICS_LEVEL_2.forEach(topic2 => {
        const topicNodeId = `l2_t_${topic2.id}`;
        GraphNodes.push({ id: topicNodeId, type: 'topic', label: topic2.name, icon: topic2.icon, x: currentX, y: MAP_CONFIG.trackY[topic2.track], topicKey: topic2.id, level: 2 });
        TOPICS_LEVEL_1.forEach(topic1 => { GraphEdges.push({ from: `l1_q_${topic1.id}_${MAP_CONFIG.questionsPerLevel}`, to: topicNodeId }); });
        let qX = currentX; let prevId = topicNodeId;
        for (let i = 1; i <= MAP_CONFIG.questionsPerLevel; i++) {
            qX += MAP_CONFIG.nodeSpacingX;
            const qId = `l2_q_${topic2.id}_${i}`;
            GraphNodes.push({ id: qId, type: 'question', label: `P${i}`, icon: `${i}`, x: qX, y: MAP_CONFIG.trackY[topic2.track], topicKey: topic2.id, qIndex: i - 1, level: 2 });
            GraphEdges.push({ from: prevId, to: qId });
            prevId = qId;
        }
    });

    currentX += (MAP_CONFIG.questionsPerLevel + 1.2) * MAP_CONFIG.nodeSpacingX;
    const goalId = 'goal';
    GraphNodes.push({ id: goalId, type: 'goal', label: 'Meta', icon: '🎓', x: currentX, y: MAP_CONFIG.trackY[1] });
    TOPICS_LEVEL_2.forEach(topic2 => { GraphEdges.push({ from: `l2_q_${topic2.id}_${MAP_CONFIG.questionsPerLevel}`, to: goalId }); });

    const canvasWidth = currentX + 200;
    ['game-map-canvas', 'game-svg-layer', 'org-map-canvas', 'org-svg-layer'].forEach(id => { document.getElementById(id).style.width = `${canvasWidth}px`; });
}

function isNodeVisibleForPlayer(node) {
    if (node.id === 'start' || node.id === 'goal') return true;
    if (node.level === 1 && localPlayer.selectedBranchL1 && node.topicKey !== localPlayer.selectedBranchL1) return false;
    if (node.level === 2 && localPlayer.selectedBranchL2 && node.topicKey !== localPlayer.selectedBranchL2) return false;
    return true;
}

function showWelcomeScreen() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('screen-welcome').classList.add('active'); }

function launchPlayerMode() {
    localPlayer.id = 'player_' + Math.floor(Math.random() * 9000 + 1000);
    const colorNames = { "#e53e3e": "Roja", "#3182ce": "Azul", "#38a169": "Verde", "#dd6b20": "Naranja", "#805ad5": "Morada", "#319795": "Turquesa" };
    localPlayer.name = `Ficha ${colorNames[localPlayer.color] || 'Jugador'} #${localPlayer.id.split('_')[1]}`;
    localPlayer.currentNodeId = "start"; localPlayer.completedNodes = ["start"]; localPlayer.progressPercent = 0; localPlayer.selectedBranchL1 = null; localPlayer.selectedBranchL2 = null; localPlayer.penaltyEndTime = 0;

    const tag = document.getElementById('player-identity-tag'); tag.textContent = localPlayer.name; tag.style.backgroundColor = localPlayer.color;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('screen-game').classList.add('active');

    renderPlayerView(); syncManager.broadcast('PLAYER_JOINED', localPlayer);
    setInterval(() => { syncManager.broadcast('PLAYER_HEARTBEAT', localPlayer); }, 3000);
}

function launchOrganizerMode() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('screen-organizer').classList.add('active'); renderOrganizerView(); syncManager.broadcast('REQUEST_PLAYER_STATES', {}); }

function renderPlayerView() {
    const canvas = document.getElementById('game-map-canvas'); const svg = document.getElementById('game-svg-layer');
    canvas.innerHTML = ''; svg.innerHTML = '';
    const visibleNodes = GraphNodes.filter(n => isNodeVisibleForPlayer(n)); const visibleNodeIds = visibleNodes.map(n => n.id);

    GraphEdges.forEach(edge => {
        if (visibleNodeIds.includes(edge.from) && visibleNodeIds.includes(edge.to)) {
            const n1 = GraphNodes.find(n => n.id === edge.from); const n2 = GraphNodes.find(n => n.id === edge.to);
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", n1.x); line.setAttribute("y1", n1.y); line.setAttribute("x2", n2.x); line.setAttribute("y2", n2.y);
            line.setAttribute("stroke", "#94a3b8"); line.setAttribute("stroke-width", "3"); line.classList.add("animated-edge"); svg.appendChild(line);
        }
    });

    visibleNodes.forEach(node => {
        const el = document.createElement('div'); const isCompleted = localPlayer.completedNodes.includes(node.id); const isCurrent = localPlayer.currentNodeId === node.id; const isUnlocked = isNodeAccessible(node.id);
        el.className = `node type-${node.type} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active-node' : ''} ${!isUnlocked ? 'locked' : ''}`;
        el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
        el.innerHTML = `<span>${node.icon}</span><div class="node-label">${node.label}</div>`;
        if (isUnlocked) { el.onclick = () => handleNodeSelection(node); }
        canvas.appendChild(el);
    });

    const targetNode = GraphNodes.find(n => n.id === localPlayer.currentNodeId);
    if (targetNode && isNodeVisibleForPlayer(targetNode)) {
        const token = document.createElement('div'); token.className = 'player-token'; token.style.backgroundColor = localPlayer.color;
        token.style.left = `${targetNode.x}px`; token.style.top = `${targetNode.y}px`; token.textContent = localPlayer.name.charAt(0); token.setAttribute('data-label', localPlayer.name);
        canvas.appendChild(token);
    }
}

function isNodeAccessible(nodeId) {
    if (nodeId === 'start') return true;
    return GraphEdges.filter(e => e.to === nodeId).some(e => localPlayer.completedNodes.includes(e.from));
}

function handleNodeSelection(node) {
    if (Date.now() < localPlayer.penaltyEndTime) { audio.playWrong(); return; }
    if (node.type === 'start') return;
    if (node.type === 'question' || node.type === 'topic') { openModalQuestion(node); } else if (node.type === 'goal') { triggerWinState(); }
}

function openModalQuestion(node) {
    const modal = document.getElementById('questionModal'); const modalCard = document.getElementById('modalCard'); const optionsContainer = document.getElementById('modalOptionsContainer');
    modalCard.classList.remove('shake'); document.getElementById('modalPenaltyBox').style.display = 'none';

    const topicData = [...TOPICS_LEVEL_1, ...TOPICS_LEVEL_2].find(t => t.id === node.topicKey);
    const qData = (QUESTION_BANK[node.topicKey] || [])[node.qIndex || 0] || { q: "¿Continuar?", opts: ["Sí"], ans: 0 };

    document.getElementById('modalTopicTitle').textContent = topicData ? topicData.name : "Desafío";
    document.getElementById('modalQuestionBody').textContent = qData.q;
    optionsContainer.innerHTML = '';
    const isPenalized = Date.now() < localPlayer.penaltyEndTime;

    qData.opts.forEach((optText, idx) => {
        const btn = document.createElement('button'); btn.className = 'btn-option'; btn.textContent = optText; btn.disabled = isPenalized;
        btn.onclick = () => {
            if (Date.now() < localPlayer.penaltyEndTime) return;
            if (idx === qData.ans) {
                audio.playCorrect(); modal.style.display = 'none';
                if (node.level === 1 && !localPlayer.selectedBranchL1) localPlayer.selectedBranchL1 = node.topicKey;
                else if (node.level === 2 && !localPlayer.selectedBranchL2) localPlayer.selectedBranchL2 = node.topicKey;
                if (!localPlayer.completedNodes.includes(node.id)) localPlayer.completedNodes.push(node.id);
                localPlayer.currentNodeId = node.id; localPlayer.progressPercent = Math.min(100, Math.round((localPlayer.completedNodes.length / 10) * 100));
                renderPlayerView(); audio.playMove(); syncManager.broadcast('PLAYER_MOVED', localPlayer);
            } else {
                audio.playWrong(); modalCard.classList.add('shake'); localPlayer.penaltyEndTime = Date.now() + 60000;
                startPenaltyCountdown(); syncManager.broadcast('PLAYER_PENALIZED', localPlayer);
            }
        };
        optionsContainer.appendChild(btn);
    });

    modal.style.display = 'flex'; if (isPenalized) startPenaltyCountdown();
}

function startPenaltyCountdown() {
    const penaltyBox = document.getElementById('modalPenaltyBox'); const banner = document.getElementById('game-penalty-banner'); const buttons = document.querySelectorAll('.btn-option');
    penaltyBox.style.display = 'block'; banner.style.display = 'block'; buttons.forEach(b => b.disabled = true);
    if (penaltyTimerInterval) clearInterval(penaltyTimerInterval);
    penaltyTimerInterval = setInterval(() => {
        const remainingMs = localPlayer.penaltyEndTime - Date.now(); const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        document.getElementById('modalCountdownText').textContent = `${secondsLeft}s`; document.getElementById('banner-timer-text').textContent = secondsLeft;
        if (secondsLeft <= 0) {
            clearInterval(penaltyTimerInterval); penaltyBox.style.display = 'none'; banner.style.display = 'none';
            buttons.forEach(b => b.disabled = false); document.getElementById('questionModal').style.display = 'none';
        }
    }, 1000);
}

function triggerWinState() { audio.playCorrect(); localPlayer.currentNodeId = 'goal'; localPlayer.progressPercent = 100; syncManager.broadcast('PLAYER_MOVED', localPlayer); renderPlayerView(); launchConfetti(); }

function renderOrganizerView() {
    const canvas = document.getElementById('org-map-canvas'); const svg = document.getElementById('org-svg-layer');
    canvas.innerHTML = ''; svg.innerHTML = '';
    GraphEdges.forEach(edge => {
        const n1 = GraphNodes.find(n => n.id === edge.from); const n2 = GraphNodes.find(n => n.id === edge.to);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", n1.x); line.setAttribute("y1", n1.y); line.setAttribute("x2", n2.x); line.setAttribute("y2", n2.y);
        line.setAttribute("stroke", "#94a3b8"); line.setAttribute("stroke-width", "2"); line.setAttribute("stroke-dasharray", "6,6"); svg.appendChild(line);
    });
    GraphNodes.forEach(node => {
        const el = document.createElement('div'); el.className = `node type-${node.type}`; el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
        el.innerHTML = `<span>${node.icon}</span><div class="node-label">${node.label}</div>`; canvas.appendChild(el);
    });
    const activePlayersArray = Object.values(connectedRealPlayers); document.getElementById('connected-count').textContent = activePlayersArray.length;
    const nodeGroups = {}; activePlayersArray.forEach(p => { if (!nodeGroups[p.currentNodeId]) nodeGroups[p.currentNodeId] = []; nodeGroups[p.currentNodeId].push(p); });
    Object.keys(nodeGroups).forEach(nodeId => {
        const group = nodeGroups[nodeId]; const targetNode = GraphNodes.find(n => n.id === nodeId); if (!targetNode) return;
        group.forEach((player, index) => {
            const token = document.createElement('div'); token.className = 'player-token'; token.style.backgroundColor = player.color; token.setAttribute('data-label', player.name);
            let offsetX = 0, offsetY = 0; if (group.length > 1) { const angle = (index / group.length) * (2 * Math.PI); offsetX = Math.cos(angle) * 18; offsetY = Math.sin(angle) * 18; }
            token.style.left = `${targetNode.x + offsetX}px`; token.style.top = `${targetNode.y + offsetY}px`; token.textContent = player.name.charAt(0); canvas.appendChild(token);
        });
    });
    const listContainer = document.getElementById('active-players-container'); listContainer.innerHTML = '';
    activePlayersArray.forEach(p => {
        const nodeObj = GraphNodes.find(n => n.id === p.currentNodeId); const isPenalized = p.penaltyEndTime && Date.now() < p.penaltyEndTime;
        const card = document.createElement('div'); card.className = 'player-summary-card';
        card.innerHTML = `<div class="card-color-dot" style="background-color: ${p.color};"></div><div class="card-details"><div class="card-player-name"><span>${p.name}</span>${isPenalized ? `<span class="penalty-badge">⏳ Penalizado (1m)</span>` : ''}</div><div class="card-player-node">Rama: <b>${p.selectedBranchL1 || 'Sin Elegir'}</b> | Ubicación: <b>${nodeObj ? nodeObj.label : 'Inicio'}</b></div><div class="progress-track"><div class="progress-fill" style="width: ${p.progressPercent || 0}%;"></div></div></div>`;
        listContainer.appendChild(card);
    });
}

function appendLogEntry(message) {
    const log = document.getElementById('live-activity-log'); if (!log) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div'); entry.className = 'log-entry'; entry.innerHTML = `<span class="time">[${timeStr}]</span> ${message}`; log.appendChild(entry); log.scrollTop = log.scrollHeight;
}

syncManager.subscribe((data) => {
    const { type, payload } = data;
    if (type === 'PLAYER_JOINED') { connectedRealPlayers[payload.id] = { ...payload, lastSeen: Date.now() }; appendLogEntry(`<span class="highlight">${payload.name}</span> se unió.`); renderOrganizerView(); }
    else if (type === 'PLAYER_MOVED') { connectedRealPlayers[payload.id] = { ...payload, lastSeen: Date.now() }; const nodeObj = GraphNodes.find(n => n.id === payload.currentNodeId); appendLogEntry(`<span class="highlight">${payload.name}</span> avanzó a: <b>${nodeObj ? nodeObj.label : 'Nodo'}</b>.`); renderOrganizerView(); }
    else if (type === 'PLAYER_PENALIZED') { connectedRealPlayers[payload.id] = { ...payload, lastSeen: Date.now() }; appendLogEntry(`<span class="penalty">${payload.name}</span> falló y fue penalizado 1 min.`); renderOrganizerView(); }
    else if (type === 'PLAYER_HEARTBEAT') { connectedRealPlayers[payload.id] = { ...payload, lastSeen: Date.now() }; }
    else if (type === 'REQUEST_PLAYER_STATES') { if (localPlayer.id) syncManager.broadcast('PLAYER_HEARTBEAT', localPlayer); }
});

setInterval(() => {
    const now = Date.now(); let updated = false;
    Object.keys(connectedRealPlayers).forEach(id => {
        if (now - connectedRealPlayers[id].lastSeen > 8000) { appendLogEntry(`<span style="color:#e53e3e;">${connectedRealPlayers[id].name}</span> se desconectó.`); delete connectedRealPlayers[id]; updated = true; }
    });
    if (updated) renderOrganizerView();
}, 4000);

document.querySelectorAll('.color-badge').forEach(badge => {
    badge.addEventListener('click', function() {
        document.querySelectorAll('.color-badge').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected'); localPlayer.color = this.getAttribute('data-color');
    });
});

function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = []; const colors = ['#e53e3e', '#3182ce', '#38a169', '#dd6b20', '#805ad5', '#ecc94b'];
    for (let i = 0; i < 140; i++) particles.push({ x: canvas.width / 2, y: canvas.height / 2, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14 - 4, size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)], life: 100 });
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); let active = false;
        particles.forEach(p => { if (p.life > 0) { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 1.2; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); active = true; } });
        if (active) requestAnimationFrame(animate);
    }
    animate();
}

window.onload = () => { buildGraphStructure(); };
