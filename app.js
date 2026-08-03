// ==========================================
// HỆ THỐNG DỮ LIỆU & BIẾN CƠ BẢN
// ==========================================
let studyData = JSON.parse(localStorage.getItem('tanock_study_data')) || {};
let subjects = JSON.parse(localStorage.getItem('tanock_subjects')) || ['C++ (Thuật toán)', 'Python', 'Toán'];
let todos = JSON.parse(localStorage.getItem('tanock_todos')) || [];
let savedTheme = localStorage.getItem('tanock_theme') || 'cyberpunk';
let pieChartInstance = null;

// QUAN TRỌNG: Danh sách phiên bản (Tự động cập nhật để chống lỗi API)
let apiRuntimes = { 'c++': '10.2.0', 'python': '3.10.0' }; 

const defaultCPPTemplate = `#include <bits/stdc++.h>\n#define ll long long\nusing namespace std;\n\nconst int MAXN = 1e5 + 5;\nint a[MAXN]; // Mảng tĩnh toàn cục\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << "Ready to Code!" << "\\n";\n    return 0;\n}`;

// ==========================================
// KHỞI ĐỘNG HỆ THỐNG
// ==========================================
window.onload = async () => {
    loadTheme();
    loadSubjects();
    updateDashboard();
    initMusic();
    renderTodos();
    showRandomQuote();
    
    // Nạp Ghi Chú
    document.getElementById('quick-notes').value = localStorage.getItem('tanock_notes') || '';
    document.getElementById('quick-notes').addEventListener('input', (e) => {
        localStorage.setItem('tanock_notes', e.target.value);
    });

    // Tự động săn phiên bản API mới nhất của Piston (Fix lỗi API)
    try {
        let res = await fetch('https://emkc.org/api/v2/piston/runtimes');
        let data = await res.json();
        let latestCpp = data.filter(r => r.language === 'c++').pop();
        let latestPy = data.filter(r => r.language === 'python').pop();
        if (latestCpp) apiRuntimes['c++'] = latestCpp.version;
        if (latestPy) apiRuntimes['python'] = latestPy.version;
        console.log("Đã cập nhật Runtimes API:", apiRuntimes);
    } catch(e) { console.log("Dùng Runtime mặc định do không lấy được API."); }
};

// ==========================================
// DAILY QUOTES & THEMES
// ==========================================
const quotes = [
    "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.",
    "Bất cứ kẻ ngốc nào cũng có thể viết mã cho máy tính hiểu. Lập trình viên giỏi viết mã cho con người hiểu.",
    "Thuật toán giống như một công thức nấu ăn, quan trọng là bạn nêm nếm nó thế nào.",
    "Không có thiên tài, chỉ có sự lặp lại hàng nghìn lần.",
    "Làm việc khi họ ngủ. Học hỏi khi họ tiệc tùng. Tận hưởng khi họ ao ước."
];
function showRandomQuote() {
    document.getElementById('daily-quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
}

function loadTheme() { document.getElementById('theme-select').value = savedTheme; changeTheme(); }
function changeTheme() {
    savedTheme = document.getElementById('theme-select').value;
    document.body.className = `theme-${savedTheme}`;
    localStorage.setItem('tanock_theme', savedTheme);
    if (window.monaco) monaco.editor.setTheme(savedTheme === 'light' ? 'vs' : 'vs-dark');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    if(tabId === 'dashboard') updateDashboard();
    showRandomQuote();
}

// ==========================================
// TODO LIST (QUẢN LÝ CÔNG VIỆC)
// ==========================================
function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.done ? 'done' : ''}`;
        li.innerHTML = `
            <span onclick="toggleTodo(${index})" style="flex:1"><i class="far ${todo.done ? 'fa-check-square' : 'fa-square'}"></i> ${todo.text}</span>
            <i class="fas fa-trash" onclick="deleteTodo(${index})"></i>
        `;
        list.appendChild(li);
    });
    localStorage.setItem('tanock_todos', JSON.stringify(todos));
}
function addTodo() {
    const input = document.getElementById('todo-input');
    if(input.value.trim() !== '') {
        todos.push({ text: input.value, done: false });
        input.value = '';
        renderTodos();
    }
}
function toggleTodo(index) { todos[index].done = !todos[index].done; renderTodos(); }
function deleteTodo(index) { todos.splice(index, 1); renderTodos(); }

// Xóa ghi chú
function clearNotes() {
    if(confirm("Bạn có chắc muốn xóa sạch bản nháp?")) {
        document.getElementById('quick-notes').value = '';
        localStorage.setItem('tanock_notes', '');
    }
}

// ==========================================
// TIMER & POMODORO
// ==========================================
let timerInterval;
let timeSeconds = 0;
let isRunning = false;
let mode = 'stopwatch'; // 'stopwatch' hoặc 'pomodoro'

function setTimerMode(newMode) {
    mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    pauseTimer();
    timeSeconds = mode === 'pomodoro' ? 25 * 60 : 0;
    updateTimeDisplay();
}

function updateTimeDisplay() {
    const h = Math.floor(timeSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (timeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('time-display').innerText = mode === 'pomodoro' ? `${m}:${s}` : `${h}:${m}:${s}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(() => {
            if(mode === 'stopwatch') timeSeconds++;
            else {
                timeSeconds--;
                if(timeSeconds <= 0) { 
                    stopTimer(true); 
                    alert("Hết 25 phút Pomodoro! Nghỉ giải lao thôi."); 
                    return;
                }
            }
            updateTimeDisplay();
        }, 1000);
    }
}

function pauseTimer() { isRunning = false; clearInterval(timerInterval); }
function stopTimer(autoSave = false) {
    pauseTimer();
    let minutesStudied = mode === 'pomodoro' ? 25 - Math.floor(timeSeconds/60) : Math.floor(timeSeconds/60);
    
    if (minutesStudied < 1 && !autoSave) {
        alert("Chưa được 1 phút mà! Không thèm lưu nhé.");
        timeSeconds = mode === 'pomodoro' ? 25*60 : 0; updateTimeDisplay(); return;
    }
    
    const subject = document.getElementById('subject-select').value;
    if (!studyData[subject]) studyData[subject] = 0;
    studyData[subject] += minutesStudied;
    localStorage.setItem('tanock_study_data', JSON.stringify(studyData));
    
    if(!autoSave) alert(`Đã lưu ${minutesStudied} phút cho môn ${subject}.`);
    timeSeconds = mode === 'pomodoro' ? 25*60 : 0;
    updateTimeDisplay(); updateDashboard();
}

function loadSubjects() {
    const select = document.getElementById('subject-select');
    select.innerHTML = '';
    subjects.forEach(sub => select.add(new Option(sub, sub)));
}
function addSubject() {
    const newSub = document.getElementById('new-subject').value.trim();
    if (newSub && !subjects.includes(newSub)) {
        subjects.push(newSub); localStorage.setItem('tanock_subjects', JSON.stringify(subjects));
        loadSubjects(); document.getElementById('new-subject').value = '';
    }
}

// ==========================================
// THỐNG KÊ (CHART.JS) & MUSIC
// ==========================================
function initMusic() {
    const savedMusic = localStorage.getItem('tanock_music');
    if (savedMusic) { document.getElementById('music-url').value = savedMusic; loadMusic(false); }
}
function loadMusic(autoplay = true) {
    const url = document.getElementById('music-url').value.trim();
    const container = document.getElementById('player-container');
    if (!url) return;
    localStorage.setItem('tanock_music', url);
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let vid = url.includes('v=') ? url.split('v=')[1].substring(0,11) : url.split('youtu.be/')[1].substring(0,11);
        container.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?${autoplay?'autoplay=1&':''}loop=1&playlist=${vid}" frameborder="0"></iframe>`;
    } else {
        container.innerHTML = `<audio id="bg-music" loop controls ${autoplay ? 'autoplay' : ''} src="${url}"></audio>`;
    }
}

function updateDashboard() {
    Chart.defaults.color = savedTheme === 'light' ? '#64748b' : '#94a3b8';
    const labels = Object.keys(studyData);
    const dataVals = Object.values(studyData);
    document.getElementById('total-time-display').innerText = `${dataVals.reduce((a, b) => a + b, 0)} Phút`;
    if (labels.length === 0) return; 
    if (pieChartInstance) pieChartInstance.destroy(); 
    pieChartInstance = new Chart(document.getElementById('subjectPieChart'), {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: dataVals, backgroundColor: ['#00f0ff', '#b026ff', '#ff0055', '#ffaa00', '#00ff00'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }
    });
}

// ==========================================
// CODE EDITOR (MONACO) & API EXECUTION
// ==========================================
let algoEditor, htmlEditor, cssEditor, jsEditor;
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    const editorTheme = savedTheme === 'light' ? 'vs' : 'vs-dark';
    algoEditor = monaco.editor.create(document.getElementById('algo-editor'), {
        value: localStorage.getItem('tanock_algo_code') || defaultCPPTemplate,
        language: 'cpp', theme: editorTheme, automaticLayout: true, minimap: { enabled: false }, fontSize: 16
    });

    algoEditor.onDidChangeModelContent(() => localStorage.setItem('tanock_algo_code', algoEditor.getValue()));
    document.getElementById('lang-select').addEventListener('change', (e) => {
        monaco.editor.setModelLanguage(algoEditor.getModel(), e.target.value.startsWith('cpp') ? 'cpp' : 'python');
    });

    const webConfig = { theme: editorTheme, automaticLayout: true, minimap: { enabled: false }, fontSize: 14 };
    htmlEditor = monaco.editor.create(document.getElementById('html-editor'), { ...webConfig, language: 'html', value: localStorage.getItem('tanock_html') || '<h1 class="title">Hello World</h1>' });
    cssEditor = monaco.editor.create(document.getElementById('css-editor'), { ...webConfig, language: 'css', value: localStorage.getItem('tanock_css') || 'body { background: #333; }\n.title { color: #00f0ff; text-align: center; margin-top: 20%; }' });
    jsEditor = monaco.editor.create(document.getElementById('js-editor'), { ...webConfig, language: 'javascript', value: localStorage.getItem('tanock_js') || 'console.log("Web loaded!");' });

    const updatePreview = () => {
        const h = htmlEditor.getValue(), c = cssEditor.getValue(), j = jsEditor.getValue();
        localStorage.setItem('tanock_html', h); localStorage.setItem('tanock_css', c); localStorage.setItem('tanock_js', j);
        document.getElementById('live-preview').srcdoc = `${h}<style>${c}</style><script>${j}<\/script>`;
    };
    htmlEditor.onDidChangeModelContent(updatePreview); cssEditor.onDidChangeModelContent(updatePreview); jsEditor.onDidChangeModelContent(updatePreview);
    setTimeout(updatePreview, 500); 
});

// THỰC THI CODE & SỬA LỖI VERSION API
async function runAlgoCode() {
    const code = algoEditor.getValue();
    const langOption = document.getElementById('lang-select').value;
    const outputBox = document.getElementById('algo-output');
    const runBtn = document.getElementById('run-btn');
    
    runBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang chạy...`;
    outputBox.innerText = "Đang kết nối Server...\n";
    
    const isCpp = langOption.startsWith('cpp');
    const langKey = isCpp ? 'c++' : 'python';
    
    // Sử dụng phiên bản đã được auto-fetch ở lúc khởi động
    let requestBody = { 
        language: langKey, 
        version: apiRuntimes[langKey], 
        files: [{ content: code }] 
    };

    if (isCpp) requestBody.compile_args = [`-std=${langOption.replace('cpp', 'c++')}`, "-O2"];

    try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
        });
        const data = await res.json();
        
        if(data.message) { outputBox.innerText = "Lỗi Server: " + data.message; }
        else {
            outputBox.innerText = data.run.output || "✅ Chương trình hoàn tất (Không có output).";
            if (data.compile && data.compile.stderr) outputBox.innerText += `\n❌ Lỗi Biên Dịch:\n${data.compile.stderr}`; 
        }
    } catch (err) { 
        outputBox.innerText = "❌ Mất kết nối! Hãy thử lại hoặc kiểm tra mạng."; 
    }
    runBtn.innerHTML = `<i class="fas fa-bolt"></i> Run Code`;
}

function downloadStringAsFile(content, filename) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = filename; a.click();
}
function downloadCode() {
    downloadStringAsFile(algoEditor.getValue(), `tanock_solution.${document.getElementById('lang-select').value.startsWith('cpp') ? 'cpp' : 'py'}`);
}
function downloadWebCode() {
    downloadStringAsFile(`<!DOCTYPE html>\n<html>\n<head><style>${cssEditor.getValue()}</style></head>\n<body>${htmlEditor.getValue()}<script>${jsEditor.getValue()}</script></body>\n</html>`, 'tanock_website.html');
}
