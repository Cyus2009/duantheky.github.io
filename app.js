// ==========================================
// HỆ THỐNG DỮ LIỆU LOCALSTORAGE
// ==========================================
let studyData = JSON.parse(localStorage.getItem('tanock_study_data')) || {};
let subjects = JSON.parse(localStorage.getItem('tanock_subjects')) || ['C++ (Thuật toán)', 'Python', 'Toán', 'Tiếng Anh'];
let savedTheme = localStorage.getItem('tanock_theme') || 'cyberpunk';
let pieChartInstance = null;

// Template mặc định tối ưu cho Thuật Toán
const defaultCPPTemplate = `#include <bits/stdc++.h>
#define ll long long
using namespace std;

const int MAXN = 1e5 + 5;
int a[MAXN]; // Mảng tĩnh

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    cout << "Ready to Code!" << "\\n";
    
    return 0;
}`;

// ==========================================
// GIAO DIỆN & TÙY CHỈNH THEME
// ==========================================
function loadTheme() {
    document.getElementById('theme-select').value = savedTheme;
    changeTheme();
}

function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('tanock_theme', theme);
    if (window.monaco) monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    if(tabId === 'dashboard') updateDashboard();
}

// ==========================================
// TRÌNH PHÁT NHẠC (YOUTUBE & MP3)
// ==========================================
function initMusic() {
    const savedMusic = localStorage.getItem('tanock_music');
    if (savedMusic) {
        document.getElementById('music-url').value = savedMusic;
        loadMusic(false); 
    }
}

function loadMusic(autoplay = true) {
    const url = document.getElementById('music-url').value.trim();
    const container = document.getElementById('player-container');
    if (!url) return;

    localStorage.setItem('tanock_music', url);
    let auto = autoplay ? 'autoplay=1&' : '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('v=')) videoId = url.split('v=')[1].substring(0, 11);
        else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].substring(0, 11);

        if (videoId) {
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?${auto}loop=1&playlist=${videoId}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
        }
    } else {
        container.innerHTML = `<audio id="bg-music" loop controls ${autoplay ? 'autoplay' : ''} src="${url}"></audio>`;
    }
}

// ==========================================
// TIMER & QUẢN LÝ MÔN HỌC
// ==========================================
let timerInterval;
let seconds = 0;
let isRunning = false;

function loadSubjects() {
    const select = document.getElementById('subject-select');
    select.innerHTML = '';
    subjects.forEach(sub => { select.add(new Option(sub, sub)); });
}

function addSubject() {
    const newSub = document.getElementById('new-subject').value.trim();
    if (newSub !== '' && !subjects.includes(newSub)) {
        subjects.push(newSub);
        localStorage.setItem('tanock_subjects', JSON.stringify(subjects));
        loadSubjects();
        document.getElementById('new-subject').value = '';
    }
}

function updateTimeDisplay() {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('time-display').innerText = `${h}:${m}:${s}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(() => { seconds++; updateTimeDisplay(); }, 1000);
    }
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
}

function stopTimer() {
    pauseTimer();
    if (seconds < 60) {
        alert("Thời gian học dưới 1 phút sẽ không được lưu.");
        seconds = 0; updateTimeDisplay(); return;
    }
    const subject = document.getElementById('subject-select').value;
    const minutesStudied = Math.floor(seconds / 60);
    
    if (!studyData[subject]) studyData[subject] = 0;
    studyData[subject] += minutesStudied;
    localStorage.setItem('tanock_study_data', JSON.stringify(studyData));
    
    alert(`Đã lưu ${minutesStudied} phút cho môn ${subject}.`);
    seconds = 0; updateTimeDisplay(); updateDashboard(); 
}

// ==========================================
// THỐNG KÊ (CHART.JS)
// ==========================================
function updateDashboard() {
    Chart.defaults.color = savedTheme === 'light' ? '#64748b' : '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const labels = Object.keys(studyData);
    const dataVals = Object.values(studyData);
    const totalMinutes = dataVals.reduce((a, b) => a + b, 0);
    document.getElementById('total-time-display').innerText = `${totalMinutes} Phút`;

    if (labels.length === 0) return; 

    const ctx = document.getElementById('subjectPieChart');
    const colors = ['#00f0ff', '#b026ff', '#ff0055', '#ffaa00', '#00ff00', '#ffff00'];

    if (pieChartInstance) pieChartInstance.destroy(); 
    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: dataVals, backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }
    });
}

// ==========================================
// CODE EDITOR (MONACO) & AUTO-SAVE
// ==========================================
let algoEditor, htmlEditor, cssEditor, jsEditor;
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    const editorTheme = savedTheme === 'light' ? 'vs' : 'vs-dark';

    const savedAlgo = localStorage.getItem('tanock_algo_code') || defaultCPPTemplate;
    algoEditor = monaco.editor.create(document.getElementById('algo-editor'), {
        value: savedAlgo, language: 'cpp', theme: editorTheme, automaticLayout: true, minimap: { enabled: false }, fontSize: 16
    });

    algoEditor.onDidChangeModelContent(() => { localStorage.setItem('tanock_algo_code', algoEditor.getValue()); });
    
    // Tự đổi highlight ngôn ngữ theo chuẩn đã chọn
    document.getElementById('lang-select').addEventListener('change', (e) => {
        const isCpp = e.target.value.startsWith('cpp');
        monaco.editor.setModelLanguage(algoEditor.getModel(), isCpp ? 'cpp' : 'python');
    });

    const webConfig = { theme: editorTheme, automaticLayout: true, minimap: { enabled: false }, fontSize: 14 };
    htmlEditor = monaco.editor.create(document.getElementById('html-editor'), { ...webConfig, language: 'html', value: localStorage.getItem('tanock_html') || '<h1 class="title">Hello World</h1>' });
    cssEditor = monaco.editor.create(document.getElementById('css-editor'), { ...webConfig, language: 'css', value: localStorage.getItem('tanock_css') || 'body { background: #333; }\n.title { color: #00f0ff; text-align: center; margin-top: 20%; }' });
    jsEditor = monaco.editor.create(document.getElementById('js-editor'), { ...webConfig, language: 'javascript', value: localStorage.getItem('tanock_js') || 'console.log("Web loaded!");' });

    const updatePreview = () => {
        const html = htmlEditor.getValue(), css = cssEditor.getValue(), js = jsEditor.getValue();
        localStorage.setItem('tanock_html', html); localStorage.setItem('tanock_css', css); localStorage.setItem('tanock_js', js);
        document.getElementById('live-preview').srcdoc = `${html}<style>${css}</style><script>${js}<\/script>`;
    };
    htmlEditor.onDidChangeModelContent(updatePreview); cssEditor.onDidChangeModelContent(updatePreview); jsEditor.onDidChangeModelContent(updatePreview);
    setTimeout(updatePreview, 500); 
});

// ==========================================
// THỰC THI CODE & TRUYỀN FLAGS (C++11/14/17/20)
// ==========================================
async function runAlgoCode() {
    const code = algoEditor.getValue();
    const langOption = document.getElementById('lang-select').value;
    const outputBox = document.getElementById('algo-output');
    
    outputBox.innerText = "Đang kết nối Server biên dịch...\n";
    
    const isCpp = langOption.startsWith('cpp');
    const languageName = isCpp ? 'c++' : 'python';

    // Tạo gói tin Request
    let requestBody = { 
        language: languageName, 
        version: "*", // Dùng bản mới nhất trên Server
        files: [{ content: code }] 
    };

    // Truyền tham số chuẩn C++ vào Compiler 
    if (isCpp) {
        const stdVersion = langOption.replace('cpp', 'c++'); // chuyển 'cpp17' thành 'c++17'
        requestBody.compile_args = [`-std=${stdVersion}`, "-O2"]; // Build với chuẩn C++ và bật cờ tối ưu thuật toán -O2
    }

    try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        
        if(data.message) {
            outputBox.innerText = "Lỗi Server: " + data.message;
            return;
        }

        outputBox.innerText = data.run.output || "✅ Chương trình chạy xong (Không có output).";
        
        // Nếu có lỗi biên dịch
        if (data.compile && data.compile.stderr) { 
            outputBox.innerText += `\n❌ Lỗi Biên Dịch (${langOption.toUpperCase()}):\n${data.compile.stderr}`; 
        }
    } catch (err) { 
        outputBox.innerText = "❌ Lỗi mạng hoặc Server đang bận. Vui lòng thử lại!"; 
    }
}

// ==========================================
// TÍNH NĂNG TẢI FILE CODE
// ==========================================
function downloadStringAsFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}
function downloadCode() {
    const isCpp = document.getElementById('lang-select').value.startsWith('cpp');
    const ext = isCpp ? 'cpp' : 'py';
    downloadStringAsFile(algoEditor.getValue(), `tanock_solution.${ext}`);
}
function downloadWebCode() {
    const code = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${cssEditor.getValue()}\n</style>\n</head>\n<body>\n${htmlEditor.getValue()}\n<script>\n${jsEditor.getValue()}\n<\/script>\n</body>\n</html>`;
    downloadStringAsFile(code, 'tanock_website.html');
}

// Khởi chạy khi load trang
loadTheme();
loadSubjects();
updateDashboard();
initMusic();
