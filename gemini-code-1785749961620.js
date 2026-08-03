// --- QUẢN LÝ TAB ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- QUẢN LÝ TIMER & MÔN HỌC ---
let timerInterval;
let seconds = 0;
let isRunning = false;

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
    const subject = document.getElementById('subject-select').value;
    alert(`Đã lưu ${Math.floor(seconds/60)} phút học môn: ${subject} vào thống kê!`);
    seconds = 0;
    updateTimeDisplay();
    // Ở phiên bản thực tế, bạn sẽ push dữ liệu này vào mảng và gọi updateCharts()
}

function addSubject() {
    const newSub = document.getElementById('new-subject').value;
    if (newSub.trim() !== '') {
        const select = document.getElementById('subject-select');
        const option = document.createElement('option');
        option.value = newSub; option.text = newSub;
        select.add(option);
        document.getElementById('new-subject').value = '';
        select.value = newSub;
    }
}

// --- KHỞI TẠO BIỂU ĐỒ (CHART.JS) ---
// Fake Data để minh họa đẹp mắt
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

// 1. Biểu đồ Tuần (Bar)
new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        datasets: [{ label: 'Giờ học tuần này', data: [3, 4.5, 2, 6, 4, 7, 5], backgroundColor: '#00f0ff', borderRadius: 6 }]
    },
    options: commonOptions
});

// 2. Biểu đồ Tháng (Line)
new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        datasets: [{ label: 'Xu hướng tháng', data: [15, 22, 18, 26], borderColor: '#b026ff', tension: 0.4, fill: true, backgroundColor: 'rgba(176, 38, 255, 0.1)' }]
    },
    options: commonOptions
});

// 3. Biểu đồ Phân bổ Môn học (Doughnut)
new Chart(document.getElementById('subjectPieChart'), {
    type: 'doughnut',
    data: {
        labels: ['C++ (Thuật toán)', 'Toán', 'IELTS', 'Hóa'],
        datasets: [{ data: [40, 20, 25, 15], backgroundColor: ['#00f0ff', '#b026ff', '#ff0055', '#ffaa00'], borderWidth: 0 }]
    },
    options: { ...commonOptions, cutout: '70%' }
});

// --- CẤU HÌNH MONACO EDITOR ---
let algoEditor, htmlEditor, cssEditor, jsEditor;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    
    // Editor cho C++/Python
    algoEditor = monaco.editor.create(document.getElementById('algo-editor'), {
        value: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello TANOCK!" << endl;\n    return 0;\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 16,
        fontFamily: "'Fira Code', monospace"
    });

    // Sự kiện đổi ngôn ngữ C++ <-> Python
    document.getElementById('lang-select').addEventListener('change', (e) => {
        const lang = e.target.value;
        monaco.editor.setModelLanguage(algoEditor.getModel(), lang);
        if(lang === 'python') algoEditor.setValue('print("Hello TANOCK from Python!")');
        else algoEditor.setValue('#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello TANOCK!" << endl;\n    return 0;\n}');
    });

    // Editors cho Web Builder
    const webConfig = { theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 14 };
    
    htmlEditor = monaco.editor.create(document.getElementById('html-editor'), { ...webConfig, language: 'html', value: '<h1 class="title">Hello World</h1>' });
    cssEditor = monaco.editor.create(document.getElementById('css-editor'), { ...webConfig, language: 'css', value: '.title {\n  color: #00f0ff;\n  text-align: center;\n  font-family: sans-serif;\n  margin-top: 20%;\n}' });
    jsEditor = monaco.editor.create(document.getElementById('js-editor'), { ...webConfig, language: 'javascript', value: 'console.log("Web loaded!");' });

    // Live Preview Auto-update
    const updatePreview = () => {
        const html = htmlEditor.getValue();
        const css = `<style>${cssEditor.getValue()}</style>`;
        const js = `<script>${jsEditor.getValue()}<\/script>`;
        const iframe = document.getElementById('live-preview');
        iframe.srcdoc = `${html}${css}${js}`;
    };

    htmlEditor.onDidChangeModelContent(updatePreview);
    cssEditor.onDidChangeModelContent(updatePreview);
    jsEditor.onDidChangeModelContent(updatePreview);
    setTimeout(updatePreview, 500); // Initial load
});

// --- EXECUTE CODE (Piston API cho C++/Python) ---
async function runAlgoCode() {
    const code = algoEditor.getValue();
    const lang = document.getElementById('lang-select').value;
    const outputBox = document.getElementById('algo-output');
    
    outputBox.innerText = "Đang biên dịch và chạy trên Cloud...";
    
    // Ánh xạ phiên bản cho API
    const languageMap = { 'cpp': { name: 'c++', version: '10.2.0' }, 'python': { name: 'python', version: '3.10.0' } };
    const execLang = languageMap[lang];

    try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: execLang.name,
                version: execLang.version,
                files: [{ content: code }]
            })
        });
        const data = await res.json();
        outputBox.innerText = data.run.output || "Chương trình chạy xong nhưng không in ra gì.";
        if (data.compile && data.compile.stderr) {
            outputBox.innerText += `\nLỗi Biên Dịch:\n${data.compile.stderr}`;
        }
    } catch (err) {
        outputBox.innerText = "Lỗi kết nối tới Server biên dịch.";
    }
}

// --- TÍNH NĂNG TẢI CODE ---
function downloadStringAsFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

function downloadCode() {
    const code = algoEditor.getValue();
    const lang = document.getElementById('lang-select').value;
    const ext = lang === 'cpp' ? 'cpp' : 'py';
    downloadStringAsFile(code, `tanock_solution.${ext}`);
}

function downloadWebCode() {
    const html = htmlEditor.getValue();
    const css = cssEditor.getValue();
    const js = jsEditor.getValue();
    const fullSource = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
    downloadStringAsFile(fullSource, 'tanock_website.html');
}