/**
 * ProjectX Admin Dashboard Logic
 * Core Technologies: Supabase, Vanilla JS, Tailwind CSS
 */

// --- CONFIGURATION ---
const SUPABASE_URL = "https://knrcqovuxkwxkafsmirm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MXq5SQESXs_BYZpx0TK4oA_fJF-A6MM";
const ADMIN_PASSWORD_HASH = "admin123"; // Simple password check (user can change this)

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- STATE MANAGEMENT ---
let allNotes = [];
let currentTab = 'upload';

// --- AUTHENTICATION ---
function checkAuth() {
    const session = localStorage.getItem('projectx_admin_session');
    if (session === 'active') {
        document.getElementById('auth-gate').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        if (currentTab === 'manage') fetchNotes();
    }
}

function handleLogin() {
    const passInput = document.getElementById('admin-pass');
    const errorMsg = document.getElementById('auth-error');
    
    if (passInput.value === ADMIN_PASSWORD_HASH) {
        localStorage.setItem('projectx_admin_session', 'active');
        document.getElementById('auth-gate').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('auth-gate').classList.add('hidden');
            document.getElementById('dashboard-ui').classList.remove('hidden');
            showToast("Authenticated Successfully", "✅");
        }, 300);
    } else {
        errorMsg.classList.remove('hidden');
        passInput.classList.add('border-red-500');
        setTimeout(() => passInput.classList.remove('border-red-500'), 2000);
    }
}
window.handleLogin = handleLogin;

function handleLogout() {
    localStorage.removeItem('projectx_admin_session');
    window.location.reload();
}

// --- UI ROUTING ---
function switchTab(tab) {
    currentTab = tab;
    // Update Nav UI
    document.getElementById('nav-upload').classList.toggle('active', tab === 'upload');
    document.getElementById('nav-manage').classList.toggle('active', tab === 'manage');
    
    // Update Section Visibility
    document.getElementById('section-upload').classList.toggle('hidden', tab !== 'upload');
    document.getElementById('section-manage').classList.toggle('hidden', tab !== 'manage');

    if (tab === 'manage') fetchNotes();
}

// --- DRAG & DROP HANDLING ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('note-file');
const fileNameDisplay = document.getElementById('file-name-display');

dropZone.onclick = () => fileInput.click();

dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary', 'bg-primary/5');
};

dropZone.ondragleave = () => {
    dropZone.classList.remove('border-primary', 'bg-primary/5');
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary', 'bg-primary/5');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileName();
    }
};

fileInput.onchange = () => updateFileName();

function updateFileName() {
    if (fileInput.files.length) {
        const file = fileInput.files[0];
        if (file.type !== 'application/pdf') {
            showToast("Only PDF files allowed", "❌");
            fileInput.value = '';
            return;
        }
        fileNameDisplay.innerText = file.name;
        fileNameDisplay.classList.add('text-primary');
    }
}

// --- UPLOAD LOGIC ---
async function handleUpload() {
    const title = document.getElementById('note-title').value.trim();
    const subject = document.getElementById('note-subject').value;
    const semester = document.getElementById('note-semester').value;
    const file = fileInput.files[0];
    const uploadBtn = document.getElementById('upload-btn');

    if (!title || !file) {
        showToast("Please fill all fields and select a file", "⚠️");
        return;
    }

    try {
        setLoading(true);
        
        // 1. Prepare unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${subject}/${fileName}`;

        // 2. Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabaseClient.storage
            .from('notes')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (storageError) throw storageError;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('notes')
            .getPublicUrl(filePath);

        // 4. Save to Database
        const { error: dbError } = await supabaseClient
            .from('notes')
            .insert([
                { 
                    title, 
                    subject, 
                    semester: parseInt(semester), 
                    file_url: publicUrl,
                    created_at: new Date().toISOString()
                }
            ]);

        if (dbError) throw dbError;

        // Success
        showToast("Note Published Successfully!", "🚀");
        resetForm();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Upload Failed", "❌");
    } finally {
        setLoading(false);
    }
}

// --- MANAGE NOTES LOGIC ---
async function fetchNotes() {
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allNotes = data;
        renderNotes(data);
    } catch (error) {
        showToast("Failed to fetch archive", "❌");
    }
}

function renderNotes(notes) {
    const container = document.getElementById('notes-list');
    if (!notes.length) {
        container.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-slate-500 text-sm">No notes found in archive.</td></tr>`;
        return;
    }

    container.innerHTML = notes.map(note => `
        <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
            <td class="px-6 py-5 font-medium text-sm">${note.title}</td>
            <td class="px-6 py-5">
                <span class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">${note.subject}</span>
            </td>
            <td class="px-6 py-5 text-slate-400 text-xs">Sem ${note.semester}</td>
            <td class="px-6 py-5 text-right">
                <button onclick="deleteNote('${note.id}', '${note.file_url}')" class="p-2 text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteNote(id, fileUrl) {
    if (!confirm("Are you sure you want to permanently delete this asset?")) return;

    try {
        // 1. Extract path from URL to delete from storage
        const path = fileUrl.split('/public/notes/')[1];
        
        // 2. Delete from DB
        const { error: dbError } = await supabaseClient
            .from('notes')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // 3. Delete from Storage (Optional but recommended)
        if (path) {
            await supabaseClient.storage.from('notes').remove([decodeURIComponent(path)]);
        }

        showToast("Asset Deleted Permanently", "🗑️");
        fetchNotes();
    } catch (error) {
        showToast("Deletion Failed", "❌");
    }
}

function filterNotes() {
    const query = document.getElementById('search-notes').value.toLowerCase();
    const filtered = allNotes.filter(n => n.title.toLowerCase().includes(query));
    renderNotes(filtered);
}

// --- HELPERS ---
function showToast(msg, icon = "✅") {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    document.getElementById('toast-icon').innerText = icon;
    
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function setLoading(isLoading) {
    const btn = document.getElementById('upload-btn');
    const progress = document.getElementById('upload-progress-container');
    
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Processing...`;
        progress.classList.remove('hidden');
        // Fake progress for UI feedback
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 30;
            if (p > 95) { p = 95; clearInterval(interval); }
            document.getElementById('progress-bar').style.width = `${p}%`;
            document.getElementById('progress-percent').innerText = `${Math.floor(p)}%`;
        }, 500);
    } else {
        btn.disabled = false;
        btn.innerHTML = `<span>Initiate Upload</span>`;
        progress.classList.add('hidden');
        document.getElementById('progress-bar').style.width = `0%`;
    }
}

function resetForm() {
    document.getElementById('note-title').value = '';
    fileInput.value = '';
    fileNameDisplay.innerText = "Click or Drag PDF here";
    fileNameDisplay.classList.remove('text-primary');
}

// Initialize check
checkAuth();
