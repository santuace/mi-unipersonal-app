// app.js - MINDSET AI Logic

const app = {
    currentClient: null,
    clients: [
        { id: 'divino', name: 'Divino', guidelines: 'Tono cercano, moderno, uruguayo.', pillars: 'Confort, Diseño Accesible, Hogar.' },
        { id: 'mcdonalds', name: 'McDonald\'s', guidelines: 'Alegre, dinámico, familiar.', pillars: 'Calidad, Rapidez, Sabor icónico.' }
    ],

    // API endpoint - dinámico según entorno
    getAPIBase() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3002';
        }
        // En producción (Vercel), usar la misma URL base
        return window.location.origin;
    },

    init() {
        // Setup initial view
        this.navigate('dashboard');
        this.setDefaultClient();
        this.renderClientList();
        this.setupDragAndDrop();
        this.setupTheme();

        // Wire up sidebar navigation
        document.querySelectorAll('.nav-item[data-target]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.target);
            });
        });

        // Load clients from localStorage
        const savedClients = localStorage.getItem('mindset_clients');
        if (savedClients) {
            try {
                this.clients = JSON.parse(savedClients);
            } catch (e) {
                console.error("Error loading clients", e);
            }
        }

        // Restore last saved outputs from localStorage
        const savedBrief = localStorage.getItem('mindset_last_brief');
        if (savedBrief) document.getElementById('brief-output').innerHTML = savedBrief;
        const savedPNT = localStorage.getItem('mindset_last_pnt');
        if (savedPNT) document.getElementById('pnt-output').innerHTML = savedPNT;
    },

    // Establecer cliente por defecto
    setDefaultClient() {
        const savedClientId = localStorage.getItem('mindset_current_client');
        if (savedClientId && this.clients.find(c => c.id === savedClientId)) {
            this.currentClient = savedClientId;
        } else if (this.clients.length > 0) {
            this.currentClient = this.clients[0].id;
            localStorage.setItem('mindset_current_client', this.currentClient);
        }
    },

    // --- THEME (DARK MODE) ---
    setupTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        // Check local storage for theme preference
        const savedTheme = localStorage.getItem('mindset_theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            toggleBtn.querySelector('span').textContent = 'light_mode';
        }

        toggleBtn.addEventListener('click', () => this.toggleTheme(toggleBtn));
    },

    toggleTheme(toggleBtn) {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');

        // Save preference
        localStorage.setItem('mindset_theme', isDark ? 'dark' : 'light');

        // Update Icon
        toggleBtn.querySelector('span').textContent = isDark ? 'light_mode' : 'dark_mode';
    },

    // --- NAVIGATION & UI ---
    navigate(viewId) {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active');
        });

        // Remove active class from menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show target view
        document.getElementById(`view-${viewId}`).classList.add('active');

        // Highlight menu (if exists)
        const targetMenu = document.querySelector(`.nav-item[data-target="${viewId}"]`);
        if (targetMenu) targetMenu.classList.add('active');

        // Update breadcrumb
        this.updateBreadcrumb(viewId);

        // Auto-behaviours on specific views
        if (viewId === 'news') {
            const output = document.getElementById('news-output');
            if (!output.innerHTML.trim()) this.getNews();
        }
        if (viewId === 'strategy-lab') {
            // Always reset to first tab when entering the lab
            this.switchLabTab('focus');
        }
    },

    updateBreadcrumb(viewId) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        const viewLabels = {
            'dashboard': 'Dashboard',
            'strategy-lab': 'Strategy Lab',
            'news': 'Noticias IA',
            'prompt-maker': 'El Prompt Perfecto',
            'brief-maker': 'Ayuda Brief',
            'pnt-maker': 'PNT Generator',
            'analyzer': 'El Analizador',
            'clients': 'Clientes'
        };

        // Mostrar/ocultar breadcrumb según la vista
        if (viewId === 'dashboard' || viewId === 'clients') {
            breadcrumb.classList.add('hidden');
            return;
        }

        breadcrumb.classList.remove('hidden');

        let html = '<a onclick="app.navigate(\'dashboard\')">Inicio</a>';

        if (this.currentClient) {
            html += '<span class="separator">/</span>';
            html += `<span>${this.getCurrentClientName()}</span>`;
        }

        html += '<span class="separator">/</span>';
        html += `<span class="current">${viewLabels[viewId] || viewId}</span>`;

        breadcrumb.innerHTML = html;
    },

    // Toast notification (replaces alert)
    toast(msg, type = 'success') {
        const iconMap = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning_amber',
            info: 'info'
        };

        const t = document.createElement('div');
        t.className = `mindset-toast ${type}`;
        t.innerHTML = `<span class="material-symbols-outlined icon">${iconMap[type]}</span><span>${msg}</span>`;
        document.body.appendChild(t);

        // Auto-remove after 3.5 seconds
        setTimeout(() => {
            t.classList.add('closing');
            setTimeout(() => t.remove(), 300);
        }, 3500);
    },

    showLoader(text = "Procesando con MINDSET AI...") {
        const loader = document.getElementById('global-loader');
        loader.querySelector('p').textContent = text;
        loader.classList.remove('hidden');
    },

    hideLoader() {
        document.getElementById('global-loader').classList.add('hidden');
    },

    // --- API HELPERS ---
    async callAPI(endpoint, payload) {
        try {
            this.showLoader();
            const apiBase = this.getAPIBase();
            const response = await fetch(`${apiBase}/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            this.hideLoader();

            if (!response.ok) {
                const errorMsg = data.error || `Error ${response.status}: ${response.statusText}`;
                this.toast(errorMsg, 'error');
                console.error('API Error:', errorMsg);
                return null;
            }
            return data;
        } catch (error) {
            this.hideLoader();
            const errorMsg = error.message || 'Error de conexión con el servidor';
            this.toast(errorMsg, 'error');
            console.error('API Error:', error);
            return null;
        }
    },

    formatMarkdown(text) {
        // Simple MD to HTML formatter for the UI
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*)/gm, '<ul><li>$1</li></ul>')
            .replace(/<\/ul>\s*<ul>/g, '');
    },

    // --- MODULES ---

    // 1. Intelligence Feed — News Cards
    async getNews() {
        const skeleton = document.getElementById('news-skeleton');
        const emptyState = document.getElementById('news-empty');
        const output = document.getElementById('news-output');
        const heroEl = document.getElementById('news-hero');
        const gridEl = document.getElementById('news-grid');
        const tsEl = document.getElementById('news-timestamp');

        // Show skeleton, hide everything else
        skeleton.classList.remove('hidden');
        emptyState.classList.add('hidden');
        output.classList.add('hidden');

        try {
            const res = await fetch(`${this.getAPIBase()}/api/news`);
            if (!res.ok) throw new Error('Error al cargar el feed');
            const data = await res.json();

            skeleton.classList.add('hidden');

            if (!data.articles || data.articles.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            // Timestamp
            tsEl.textContent = `Actualizado: ${data.generated_at || new Date().toLocaleDateString('es-AR')}`;

            // Sentiment colors
            const sentimentMap = {
                positive: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: '#059669' },
                neutral: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', dot: '#0284c7' },
                disruptive: { badge: 'bg-ogilvy-red/10 text-ogilvy-red dark:bg-red-900/40 dark:text-red-300', dot: '#E02227' }
            };

            const buildCard = (article, isHero = false) => {
                const sm = sentimentMap[article.sentiment] || sentimentMap.neutral;
                const sentimentLabel = { positive: 'Positivo', neutral: 'Neutral', disruptive: 'Disruptivo' }[article.sentiment] || 'Neutral';
                const articleUrl = article.source_url || `https://news.google.com/search?q=${encodeURIComponent(article.headline)}&hl=es-419`;
                const sourceName = article.source_name || 'Google News';
                const openLink = `onclick="window.open('${articleUrl}', '_blank')"`;

                if (isHero) {
                    return `
                    <div ${openLink} class="border border-black/15 dark:border-white/15 dark:bg-white/5 p-8 flex gap-8 hover:border-ogilvy-red dark:hover:border-white transition-colors group cursor-pointer">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-ogilvy-red text-white">${article.category}</span>
                                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${sm.badge}">${sentimentLabel}</span>
                                <span class="text-[9px] text-charcoal/40 dark:text-white/40 ml-auto">📰 ${sourceName} &nbsp;·&nbsp; ● ${article.read_time} min de lectura</span>
                            </div>
                            <h3 class="font-serif text-2xl font-bold text-ogilvy-black dark:text-white leading-tight mb-3 group-hover:text-ogilvy-red dark:group-hover:text-white/80 transition-colors">${article.headline}</h3>
                            <p class="text-sm text-charcoal/70 dark:text-white/70 leading-relaxed mb-4">${article.summary}</p>
                            <div class="pt-4 border-t border-black/10 dark:border-white/10 grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-[8px] font-bold uppercase tracking-widest text-charcoal/40 dark:text-white/40 mb-1">Impacto en Marketing</p>
                                    <p class="text-xs text-charcoal/80 dark:text-white/80 leading-relaxed">${article.marketing_impact}</p>
                                </div>
                                <div>
                                    <p class="text-[8px] font-bold uppercase tracking-widest text-charcoal/40 dark:text-white/40 mb-1">Key Takeaway</p>
                                    <p class="text-xs font-semibold text-ogilvy-red dark:text-white/90">"${article.key_takeaway}"</p>
                                </div>
                            </div>
                        </div>
                        <div class="w-1 self-stretch bg-ogilvy-red shrink-0"></div>
                    </div>`;
                }

                return `
                <div ${openLink} class="border border-black/15 dark:border-white/15 dark:bg-white/5 p-5 flex flex-col hover:border-ogilvy-red dark:hover:border-white transition-colors group cursor-pointer">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-black/5 dark:bg-white/10 text-charcoal/70 dark:text-white/70">${article.category}</span>
                        <span class="text-[8px] text-charcoal/40 dark:text-white/40 ml-auto">📰 ${sourceName} · ${article.read_time} min</span>
                    </div>
                    <h4 class="font-serif text-base font-bold text-ogilvy-black dark:text-white leading-snug mb-2 group-hover:text-ogilvy-red dark:group-hover:text-white/80 transition-colors">${article.headline}</h4>
                    <p class="text-xs text-charcoal/60 dark:text-white/60 leading-relaxed mb-4 flex-1">${article.summary}</p>
                    <div class="mt-auto pt-3 border-t border-black/10 dark:border-white/10">
                        <p class="text-[8px] font-bold uppercase tracking-widest text-charcoal/40 dark:text-white/40 mb-1">Takeaway</p>
                        <p class="text-xs font-semibold text-ogilvy-red dark:text-white/80 leading-snug">"${article.key_takeaway}"</p>
                    </div>
                </div>`;
            };

            // Hero = first article
            heroEl.innerHTML = buildCard(data.articles[0], true);

            // Grid = remaining articles (up to 5)
            gridEl.innerHTML = data.articles.slice(1, 6).map(a => buildCard(a, false)).join('');

            output.classList.remove('hidden');
        } catch (err) {
            skeleton.classList.add('hidden');
            emptyState.classList.remove('hidden');
            this.toast('Error al cargar el feed: ' + err.message, 'error');
        }
    },

    // 2. Prompt Perfecto
    async optimizePrompt() {
        const ideaInput = document.getElementById('prompt-idea');
        const idea = ideaInput.value.trim();
        if (!idea) return;

        ideaInput.value = '';
        const chatbox = document.getElementById('chat-messages');

        // Add User Message
        chatbox.innerHTML += `
                <div class="message user">
                    <div class="avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="bubble">${idea}</div>
                </div>
                `;
        chatbox.scrollTop = chatbox.scrollHeight;

        const res = await this.callAPI('optimize-prompt', { idea });
        if (res) {
            chatbox.innerHTML += `
                <div class="message system">
                    <div class="avatar"><i class="fa-solid fa-brain"></i></div>
                    <div class="bubble">${this.formatMarkdown(res.optimizedPrompt)}</div>
                </div>
                `;
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    },

    // 3. Form Data Extraction Helper
    getBriefFormData() {
        return `
                Cliente: ${document.getElementById('bm-client').value}
                Desafío: ${document.getElementById('bm-challenge').value}
                Público: ${document.getElementById('bm-target').value}
                Idea Central: ${document.getElementById('bm-idea').value}
                RTBs: ${document.getElementById('bm-rtb').value}
                Entregables: ${document.getElementById('bm-deliverables').value}
                `;
    },

    async generateBrief() {
        const data = this.getBriefFormData();
        const prompt = `
                Actúa como un Director General Creativo. Transforma la siguiente información en un Brief Estratégico inspirador de 6 puntos.
                Usa negritas para resaltar títulos y bullets para listar. Hazlo sonar profesional, estratégico y muy creativo, listo para entregarse a la agencia.

                INFORMACIÓN BASE:
                ${data}
                `;
        const res = await this.callAPI('generate', { prompt });
        if (res) {
            const html = this.formatMarkdown(res.text);
            document.getElementById('brief-output').innerHTML = html;
            localStorage.setItem('mindset_last_brief', html);
        }
    },

    // 4. PNT Generator
    async generatePNT() {
        const client = document.getElementById('pnt-client').value;
        const medium = document.getElementById('pnt-medium').value;
        const duration = document.getElementById('pnt-duration').value;
        const info = document.getElementById('pnt-info').value;

        const prompt = `
                Actúa como un redactar senior de radio y tv. Genera un guion de Publicidad No Tradicional (PNT) para ser leído en vivo.
                Debe sonar fluido, persuasivo y captar la atención inmediatamente.

                - Cliente: ${client}
                - Medio: ${medium}
                - Duración esperada: ${duration}
                - Info obligatoria: ${info}

                Devuelve SOLAMENTE el texto listo para ser leído por el locutor.
                `;
        const res = await this.callAPI('generate', { prompt });
        if (res) {
            const html = this.formatMarkdown(res.text);
            document.getElementById('pnt-output').innerHTML = html;
            localStorage.setItem('mindset_last_pnt', html);
        }
    },

    // 5. Analizador (Drag & Drop + Image handling)
    setupDragAndDrop() {
        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('an-file');
        const fileName = document.getElementById('file-name');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files.length > 0) {
                const file = files[0];
                fileName.textContent = `✅ Archivo seleccionado: ${file.name}`;
                fileName.classList.remove('hidden');

                // Store file for later upload
                app.currentFile = file;
            }
        }
    },

    async convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Only data part
            reader.onerror = error => reject(error);
        });
    },

    async analyzeContent() {
        const context = document.getElementById('an-context').value;
        const text = document.getElementById('an-text').value;

        let payload = {
            prompt: `
                Actúa como un Director Estratégico de una gran agencia creativa. Usa tu máximo rigor analítico.
                Analiza el contenido provisto para este contexto/audiencia: "${context}".
                Genera un informe estructurado con 4 puntajes sobre 10, y una sección final de recomendaciones.
                
                1. **Performance Predictiva**: (1-10) ${text ? 'Basado en el copy' : ''}
                2. **Targeting**: (1-10) ¿Resuena con la audiencia?
                3. **Tono y Voz**: (1-10)
                4. **Call To Action (CTA)**: (1-10)
                
                Contenido de texto adjunto (si aplica): "${text}"
            `
        };

        if (this.currentFile) {
            const base64 = await this.convertFileToBase64(this.currentFile);
            payload.imageBase64 = base64;
            payload.imageMimeType = this.currentFile.type;
        }

        const res = await this.callAPI('generate', payload);
        if (res) document.getElementById('analyzer-output').innerHTML = this.formatMarkdown(res.text);
    },

    // 6. Repositorio de Clientes
    renderClientList() {
        // Actualizar el selector
        const selector = document.getElementById('client-selector');
        if (selector) {
            selector.querySelector('span').textContent = this.getCurrentClientName();
        }

        // Actualizar la lista en el dropdown
        const dropdown = document.getElementById('client-dropdown');
        if (dropdown) {
            dropdown.innerHTML = '';
            this.clients.forEach(client => {
                const isActive = this.currentClient && this.currentClient === client.id;
                const item = document.createElement('div');
                item.className = `client-item ${isActive ? 'active' : ''}`;
                item.textContent = client.name;
                item.onclick = () => this.selectClient(client.id);
                dropdown.appendChild(item);
            });
        }

        // Mantener compatibilidad con cliente-list si existe
        const list = document.getElementById('client-list');
        if (list) {
            list.innerHTML = '';
            this.clients.forEach(client => {
                const isActive = this.currentClient && this.currentClient === client.id;
                list.innerHTML += `
                    <div class="client-item ${isActive ? 'active' : ''}" onclick="app.selectClient('${client.id}')">
                        ${client.name}
                    </div>
                `;
            });
        }
    },

    toggleNewClientInput() {
        document.getElementById('new-client-box').classList.toggle('hidden');
    },

    addClient() {
        const nameInput = document.getElementById('new-client-name');
        const name = nameInput.value.trim();
        if (!name) return;

        const id = name.toLowerCase().replace(/\\s+/g, '-');
        this.clients.push({ id, name, guidelines: '', pillars: '' });
        this.saveClients();

        nameInput.value = '';
        this.toggleNewClientInput();
        this.selectClient(id);
    },

    saveClients() {
        localStorage.setItem('mindset_clients', JSON.stringify(this.clients));
    },

    selectClient(id) {
        this.currentClient = this.clients.find(c => c.id === id);
        localStorage.setItem('mindset_current_client', id);
        this.renderClientList();
        this.closeClientDropdown();

        document.getElementById('empty-client-state').classList.add('hidden');
        document.getElementById('client-content').classList.remove('hidden');

        document.getElementById('display-client-name').textContent = this.currentClient.name;
        document.getElementById('cfg-guidelines').value = this.currentClient.guidelines;
        document.getElementById('cfg-pillars').value = this.currentClient.pillars;
    },

    toggleClientDropdown() {
        const dropdown = document.getElementById('client-dropdown');
        if (!dropdown) return;
        dropdown.classList.toggle('active');
    },

    closeClientDropdown() {
        const dropdown = document.getElementById('client-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    },

    getCurrentClientName() {
        if (!this.currentClient) return 'Seleccionar cliente';
        return this.clients.find(c => c.id === this.currentClient)?.name || 'Sin cliente';
    },

    // --- HISTORY MANAGEMENT ---
    saveToHistory(clientId, toolType, input, output) {
        const historyKey = `mindset_history_${clientId}_${toolType}`;
        let history = [];

        try {
            const saved = localStorage.getItem(historyKey);
            if (saved) history = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading history', e);
        }

        const entry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString('es-AR'),
            input: typeof input === 'string' ? input : JSON.stringify(input),
            output: output,
            version: 1
        };

        history.unshift(entry);
        // Limitar a últimas 20 generaciones por cliente/tool
        if (history.length > 20) history = history.slice(0, 20);

        localStorage.setItem(historyKey, JSON.stringify(history));
        this.toast('Generación guardada', 'success');
        return entry.id;
    },

    getHistory(clientId, toolType) {
        const historyKey = `mindset_history_${clientId}_${toolType}`;
        try {
            const saved = localStorage.getItem(historyKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading history', e);
            return [];
        }
    },

    deleteHistoryEntry(clientId, toolType, entryId) {
        const historyKey = `mindset_history_${clientId}_${toolType}`;
        let history = this.getHistory(clientId, toolType);
        history = history.filter(entry => entry.id !== entryId);
        localStorage.setItem(historyKey, JSON.stringify(history));
        this.toast('Versión eliminada', 'success');
    },

    loadHistoryEntry(clientId, toolType, entryId, outputElementId) {
        const history = this.getHistory(clientId, toolType);
        const entry = history.find(e => e.id === entryId);
        if (entry && document.getElementById(outputElementId)) {
            document.getElementById(outputElementId).innerHTML = entry.output;
            this.toast('Versión cargada', 'success');
        }
    },

    saveCurrentClient() {
        if (!this.currentClient) return;

        this.currentClient.guidelines = document.getElementById('cfg-guidelines').value;
        this.currentClient.pillars = document.getElementById('cfg-pillars').value;

        this.saveClients();
        this.toast(`✅ Memoria guardada para ${this.currentClient.name}`);
    },

    deleteClient() {
        if (!this.currentClient) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${this.currentClient.name}?`)) {
            return;
        }

        this.clients = this.clients.filter(c => c.id !== this.currentClient.id);
        this.saveClients();
        this.currentClient = null;

        document.getElementById('client-content').classList.add('hidden');
        document.getElementById('empty-client-state').classList.remove('hidden');

        this.renderClientList();
        this.toast(`🗑️ Cliente eliminado correctamente.`);
    },

    async uploadClientDocument(event) {
        const file = event.target.files[0];
        if (!file || !this.currentClient) return;

        const formData = new FormData();
        formData.append('file', file);

        this.showLoader(`Procesando documento: ${file.name}...`);
        try {
            const response = await fetch(`${this.getAPIBase()}/api/upload-client-doc`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            this.hideLoader();

            if (!response.ok) throw new Error(data.error || 'Error al procesar el archivo');

            const pillarsInput = document.getElementById('cfg-pillars');
            const newContent = `\\n\\n--- Documento: ${file.name} ---\\n${data.synthesis}`;
            pillarsInput.value = (pillarsInput.value + newContent).trim();

            this.saveCurrentClient();
            this.toast(`📄 Documento analizado y agregado a la memoria.`);
        } catch (error) {
            this.hideLoader();
            alert('❌ Error: ' + error.message);
        }

        // Reset the file input so the same file could be uploaded again if needed
        event.target.value = '';
    },

    // ---- STRATEGIC INSIGHTS LAB ----

    switchLabTab(tabId) {
        // Hide all lab content panels
        document.querySelectorAll('.lab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        // Show target tab
        document.getElementById(`lab-tab-${tabId}`).classList.add('active');

        // Highlight the correct tab button
        const buttons = document.querySelectorAll('.tab-btn');
        const tabMap = { focus: 0, archetypes: 1, trends: 2, competitors: 3 };
        if (buttons[tabMap[tabId]]) buttons[tabMap[tabId]].classList.add('active');

        // If switching to archetypes, populate the client selector
        if (tabId === 'archetypes') {
            this.populateArchetypeClients();
        }
    },

    // 1. Focus Group Virtual

    addAvatarInput() {
        const container = document.getElementById('fg-avatars-container');
        const count = container.querySelectorAll('.avatar-entry').length + 1;
        const div = document.createElement('div');
        div.className = 'avatar-entry p-3 bg-light-gray dark:bg-white/10 space-y-2 relative';
        div.innerHTML = `
            <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-charcoal/30 hover:text-ogilvy-red transition-colors dark:text-white/40 dark:hover:text-white">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
            <p class="text-[8px] font-bold uppercase tracking-widest text-charcoal/50 dark:text-white/60">Avatar ${count}</p>
            <input type="text" placeholder="Nombre (Ej: Participante ${count})" required
                class="fg-name w-full border-b border-black/15 dark:border-white/20 bg-transparent py-1 text-sm outline-none focus:border-ogilvy-red dark:focus:border-white transition-colors placeholder-charcoal/25 dark:placeholder-white/40 dark:text-white">
            <input type="text" placeholder="Perfil (Ej: Consumidor frecuente)" required
                class="fg-profile w-full border-b border-black/15 dark:border-white/20 bg-transparent py-1 text-sm outline-none focus:border-ogilvy-red dark:focus:border-white transition-colors placeholder-charcoal/25 dark:placeholder-white/40 dark:text-white">
        `;
        container.appendChild(div);
    },

    async runFocusGroup() {
        const entries = document.querySelectorAll('#fg-avatars-container .avatar-entry');
        const avatars = Array.from(entries).map(entry => ({
            name: entry.querySelector('.fg-name').value.trim(),
            profile: entry.querySelector('.fg-profile').value.trim()
        })).filter(a => a.name && a.profile);

        if (avatars.length === 0) {
            alert('Añade al menos un panelista para debatir la premisa.');
            return;
        }

        const idea = document.getElementById('fg-idea').value;

        const namesText = avatars.map(a => `<strong>${a.name}</strong>`).join(', ').replace(/, ([^,]*)$/, ' y $1');

        const chatHistory = document.getElementById('fg-chat-history');
        chatHistory.innerHTML = `
            <div class="flex gap-3">
                <div style="width:28px;height:28px;border-radius:50%;background:#E0222715;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span class="material-symbols-outlined" style="color:#E02227;font-size:14px;">biotech</span>
                </div>
                <div style="background:#f5f5f5;padding:10px 14px;border-radius:0 10px 10px 10px;font-size:12px;line-height:1.5;font-style:italic;" class="dark:bg-white/10 dark:text-white/90 border border-transparent dark:border-white/10">
                    🎙️ Iniciando sesión con ${namesText}...
                </div>
            </div>
        `;

        this.showLoader('Generando el debate de Focus Group...');
        try {
            const response = await fetch(`${this.getAPIBase()}/api/focus-group`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatars, idea })
            });
            const data = await response.json();
            this.hideLoader();

            if (data.error) { alert('❌ ' + data.error); return; }

            // Render debate messages with animation delay
            const avatarMsIcons = ['person', 'person_4', 'person_3', 'face', 'support_agent', 'emoji_people'];
            const avatarColors = ['#E02227', '#1d4ed8', '#059669', '#d97706', '#6d28d9', '#be185d'];

            data.debate.forEach((turn, i) => {
                // Try finding by exact name first, if not, find by partial match, otherwise use the loop index module length
                let avatarIndex = avatars.findIndex(a => a.name.toLowerCase() === turn.speaker.toLowerCase());
                if (avatarIndex === -1) {
                    avatarIndex = avatars.findIndex(a => turn.speaker.toLowerCase().includes(a.name.toLowerCase()));
                }
                if (avatarIndex === -1) {
                    avatarIndex = i % avatars.length; // Fallback
                }

                const icon = avatarMsIcons[avatarIndex % avatarMsIcons.length];
                const color = avatarColors[avatarIndex % avatarColors.length];
                const msgEl = document.createElement('div');
                msgEl.className = 'flex gap-3';
                msgEl.style.cssText = `animation: fadeIn 0.3s ease; animation-delay: ${i * 0.15}s; animation-fill-mode: both;`;
                msgEl.innerHTML = `
                    <div style="width:28px;height:28px;border-radius:50%;background:${color}15;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="color:${color};font-size:14px;">${icon}</span>
                    </div>
                    <div style="background:#f5f5f5;padding:10px 14px;border-radius:0 10px 10px 10px;font-size:12px;line-height:1.5;max-width:85%;">
                        <strong style="color:${color};font-size:10px;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px;">${turn.speaker}</strong>
                        ${turn.message}
                    </div>
                `;
                chatHistory.appendChild(msgEl);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            });

            // Render Sentiment Report
            const sr = data.sentiment_report;
            const scoreColor = sr.score >= 7 ? '#059669' : sr.score >= 4 ? '#d97706' : '#E02227';
            const reportEl = document.createElement('div');
            reportEl.style.cssText = 'margin: 16px 0; padding: 20px; background: #f9f9f9; border: 1px solid rgba(0,0,0,0.1); border-left: 3px solid #E02227;';
            reportEl.innerHTML = `
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#E02227;margin-bottom:10px;">📊 Sentiment Report</div>
                <div style="font-family:'Libre Baskerville',serif;font-size:2rem;font-weight:700;color:${scoreColor};margin-bottom:6px;">${sr.score}/10</div>
                <p style="font-size:13px;color:#333;margin-bottom:12px;line-height:1.5;">${sr.overall_verdict}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <div style="background:#f0fdf4;padding:10px;border:1px solid #bbf7d0;">
                        <strong style="color:#059669;font-size:10px;">✅ Positivos</strong><br>
                        <span style="font-size:12px;">${sr.positives.map(p => `• ${p}`).join('<br>')}</span>
                    </div>
                    <div style="background:#fff5f5;padding:10px;border:1px solid #fecaca;">
                        <strong style="color:#E02227;font-size:10px;">⚠️ Negativos</strong><br>
                        <span style="font-size:12px;">${sr.negatives.map(n => `• ${n}`).join('<br>')}</span>
                    </div>
                </div>
                <div style="background:#fff;padding:12px;border:1px solid rgba(0,0,0,0.08);">
                    <strong style="color:#000;font-size:10px;">💡 Recomendación:</strong> <span style="font-size:12px;">${sr.recommendation}</span>
                </div>
            `;
            chatHistory.appendChild(reportEl);
            chatHistory.scrollTop = chatHistory.scrollHeight;

        } catch (err) {
            this.hideLoader();
            alert('❌ Error de conexión: ' + err.message);
        }
    },

    // 2. Archetype Wheel
    archetypeChartInstance: null,

    populateArchetypeClients() {
        const selectEl = document.getElementById('arch-client-select');
        if (!selectEl) return;
        
        selectEl.innerHTML = '<option value="" disabled selected>Seleccioná un cliente...</option>';
        this.clients.forEach((client, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = client.name;
            selectEl.appendChild(opt);
        });

        if (this.currentClient) {
            const idx = this.clients.findIndex(c => c.name === this.currentClient.name);
            if (idx !== -1) selectEl.value = idx;
        }
    },

    async generateArchetypes() {
        const selectEl = document.getElementById('arch-client-select');
        const selectedIndex = selectEl ? selectEl.value : "";
        
        if (selectedIndex === "") {
            alert('⚠️ Primero seleccioná un cliente en el menú desplegable.');
            return;
        }

        const selectedClient = this.clients[selectedIndex];

        this.showLoader('Analizando ADN de marca...');
        try {
            const response = await fetch(`${this.getAPIBase()}/api/archetypes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: selectedClient.name,
                    guidelines: selectedClient.guidelines,
                    pillars: selectedClient.pillars
                })
            });
            const data = await response.json();
            this.hideLoader();

            if (data.error) { alert('❌ ' + data.error); return; }

            const labels = Object.keys(data.scores);
            const values = Object.values(data.scores);

            const isDark = document.documentElement.classList.contains('dark');

            // Set chart colors based on theme for better contrast (dark theme uses red bg, so we need pure white)
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
            const labelColor = isDark ? '#ffffff' : '#333333';
            const tickColor = isDark ? 'rgba(255, 255, 255, 0.8)' : '#666666';
            
            // Brand color (Ogilvy Red in light, Stark white in dark)
            const brandColor = isDark ? '#ffffff' : '#E02227';
            const brandBg = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(224, 34, 39, 0.15)';

            // Destroy previous chart if exists
            if (this.archetypeChartInstance) {
                this.archetypeChartInstance.destroy();
            }

            const ctx = document.getElementById('archetypeChart').getContext('2d');
            this.archetypeChartInstance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: selectedClient.name,
                        data: values,
                        backgroundColor: brandBg,
                        borderColor: brandColor,
                        borderWidth: 2,
                        pointBackgroundColor: isDark ? '#ffffff' : '#E02227',
                        pointBorderColor: isDark ? '#222222' : '#ffffff',
                        pointHoverBackgroundColor: isDark ? '#222222' : '#ffffff',
                        pointHoverBorderColor: brandColor,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            angleLines: { color: gridColor, lineWidth: 1 },
                            grid: { color: gridColor, lineWidth: 1, circular: true },
                            pointLabels: { color: labelColor, font: { size: 12, family: 'Inter, sans-serif', weight: 'bold' } },
                            ticks: { color: tickColor, backdropColor: 'transparent', stepSize: 20 },
                            min: 0, max: 100
                        }
                    },
                    plugins: {
                        legend: { labels: { color: labelColor, font: { family: 'Inter, sans-serif' } } }
                    }
                }
            });

            document.getElementById('arch-summary').innerHTML = `
                <div class="mt-4 p-5 rounded-lg bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10">
                    <strong class="font-serif text-lg text-ogilvy-red dark:text-white block mb-2">Arquetipo Dominante: ${data.dominant}</strong>
                    <p class="text-sm text-charcoal/80 dark:text-white/80 leading-relaxed">${data.summary}</p>
                </div>
            `;

        } catch (err) {
            this.hideLoader();
            alert('❌ Error de conexión: ' + err.message);
        }
    },

    // 3. Trend Forecaster
    async generateTrends() {
        const category = document.getElementById('tf-category').value;
        const output = document.getElementById('tf-output');
        output.innerHTML = '<p style="color: #777;">Proyectando escenarios...</p>';

        this.showLoader('Consultando el oráculo de tendencias...');
        try {
            const response = await fetch(`${this.getAPIBase()}/api/trend-forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });
            const data = await response.json();
            this.hideLoader();

            if (data.error) { alert('❌ ' + data.error); return; }

            const scenarios = [
                { key: 'optimist', icon: '🌟', label: 'Escenario Optimista', color: '#10b981' },
                { key: 'chaotic', icon: '🌀', label: 'Escenario Caótico', color: '#f59e0b' },
                { key: 'disruptive', icon: '⚡', label: 'Escenario Disruptivo', color: '#ef4444' },
            ];

            output.innerHTML = scenarios.map(s => `
                <div style="margin-bottom: 20px; padding: 20px; border-radius: 12px; border: 1px solid ${s.color}44; background: ${s.color}0d;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: ${s.color}; margin-bottom: 8px;">${s.icon} ${s.label}: ${data[s.key].title}</div>
                    <p style="color: #ccc; line-height: 1.6; margin-bottom: 10px;">${data[s.key].narrative}</p>
                    <div style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 0.9rem;">
                        <strong style="color: ${s.color};">💡 Consejo:</strong> ${data[s.key].strategic_tip}
                    </div>
                </div>
            `).join('');

        } catch (err) {
            this.hideLoader();
            alert('❌ Error de conexión: ' + err.message);
        }
    },

    // 4. Competitor Mind-Reader
    async generateMatrix() {
        const competitors = document.getElementById('cm-competitors').value;
        const axis = document.getElementById('cm-axis').value;
        const output = document.getElementById('cm-output');
        output.innerHTML = '<p style="color: #777;">Leyendo la mente de la competencia...</p>';

        this.showLoader('Construyendo la Matriz de Vulnerabilidad...');
        try {
            const response = await fetch(`${this.getAPIBase()}/api/competitor-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competitors, axis })
            });
            const data = await response.json();
            this.hideLoader();

            if (data.error) { alert('❌ ' + data.error); return; }
            output.innerHTML = this.formatMarkdown(data.text);

        } catch (err) {
            this.hideLoader();
            alert('❌ Error de conexión: ' + err.message);
        }
    }

};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Cerrar dropdown de cliente al hacer click fuera
document.addEventListener('click', (e) => {
    const selector = document.getElementById('client-selector');
    const dropdown = document.getElementById('client-dropdown');
    if (dropdown && selector && !selector.contains(e.target) && !dropdown.contains(e.target)) {
        app.closeClientDropdown();
    }
});
