document.addEventListener('DOMContentLoaded', () => {
    const inputForm = document.getElementById('symptomForm');
    const symptomsInput = document.getElementById('symptomsInput');
    const submitBtn = document.getElementById('submitBtn');
    const messageStream = document.getElementById('messageStream');
    
    const emptyState = document.getElementById('emptyState');
    const inputAreaBox = document.getElementById('inputAreaBox');
    const chatContainer = document.getElementById('chatContainer');
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    
    // Sidebar logic
    const historyContainer = document.getElementById('historyContainer');
    const pinnedContainer = document.getElementById('pinnedContainer');
    const pinnedChatsContainer = document.getElementById('pinnedChatsContainer');
    const newChatBtn = document.getElementById('newChatBtn');
    
    // Tooltips
    const modelTooltip = document.getElementById('modelTooltip');

    // Sidebars & Modals
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const contextMenu = document.getElementById('contextMenuShadow');
    const renameModal = document.getElementById('renameModal');
    const renameInput = document.getElementById('renameInput');
    const renameSave = document.getElementById('renameSave');
    const renameCancel = document.getElementById('renameCancel');

    // Multi-turn State Tracking
    let currentChatId = null;
    let currentMenuTargetId = null;

    // Initialization
    setCenteredInputState(true);
    fetchHistoryList();
    fetchModelConfig();

    async function fetchModelConfig() {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            modelTooltip.textContent = data.model;
        } catch(e) {
            modelTooltip.textContent = "Offline";
        }
    }

    // -- Textarea Resize --
    symptomsInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        submitBtn.disabled = this.value.trim() === '';
    });

    symptomsInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') inputForm.dispatchEvent(new Event('submit'));
        }
    });

    // -- Submit Multi-turn Payload --
    inputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const symptoms = symptomsInput.value.trim();
        if (!symptoms) return;

        setCenteredInputState(false);
        
        symptomsInput.value = '';
        symptomsInput.style.height = 'auto';
        submitBtn.disabled = true;

        appendMessage('user', symptoms);
        const loadingId = appendLoading();

        try {
            const response = await fetch('/api/check-symptoms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms, chatId: currentChatId })
            });
            const data = await response.json();
            
            removeElement(loadingId);

            if (!response.ok) {
                appendMessage('ai', `**Error:** ${data.error || 'Something went wrong.'}`);
            } else {
                appendMessage('ai', data.analysis, symptoms);
                const isFirstMessage = (currentChatId === null);
                // Bind state memory
                currentChatId = data.chatId; 
                
                // Only refresh history sidebar if it's uniquely new pulling a new title
                if (isFirstMessage) fetchHistoryList(); 
            }
        } catch (error) {
            removeElement(loadingId);
            appendMessage('ai', `**Network Error:** Could not connect to the server.`);
        }
    });

    function setCenteredInputState(isNewChat) {
        if (isNewChat) {
            currentChatId = null;
            emptyState.style.display = 'flex';
            inputAreaBox.classList.add('centered-input');
            messageStream.innerHTML = '';
        } else {
            emptyState.style.display = 'none';
            inputAreaBox.classList.remove('centered-input');
        }
    }

    newChatBtn.addEventListener('click', () => {
        setCenteredInputState(true);
        if (window.innerWidth <= 768) closeSidebar();
    });

    // -- UI Message Building --
    function appendMessage(role, content, rawSymptomRef = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`;
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'message-inner';

        if (role === 'ai') {
            const avatar = document.createElement('div');
            avatar.className = 'avatar ai-avatar';
            avatar.innerHTML = `<svg width="18" height="18"><use href="#icon-medical"></use></svg>`;
            innerDiv.appendChild(avatar);
        }

        const contentWrapper = document.createElement('div');
        contentWrapper.style.flex = '1';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content markdown-body';
        
        if (role === 'ai') {
            contentDiv.innerHTML = marked.parse(content);
            contentWrapper.appendChild(contentDiv);
            
            const tray = document.createElement('div');
            tray.className = 'action-tray';
            
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = `<svg width="16" height="16"><use href="#icon-copy"></use></svg>`;
            copyBtn.className = 'action-btn';
            copyBtn.title = 'Copy response blocks';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = `<svg width="16" height="16"><use href="#icon-check"></use></svg>`;
                setTimeout(() => copyBtn.innerHTML = `<svg width="16" height="16"><use href="#icon-copy"></use></svg>`, 2000);
            };

            const editBtn = document.createElement('button');
            editBtn.innerHTML = `<svg width="16" height="16"><use href="#icon-edit"></use></svg>`;
            editBtn.className = 'action-btn';
            editBtn.title = 'Edit your original prompt';
            editBtn.onclick = () => {
                if(rawSymptomRef) {
                    symptomsInput.value = rawSymptomRef;
                    symptomsInput.focus();
                    symptomsInput.style.height = 'auto';
                    symptomsInput.style.height = (symptomsInput.scrollHeight) + 'px';
                    submitBtn.disabled = false;
                }
            };

            tray.appendChild(copyBtn);
            if (rawSymptomRef) tray.appendChild(editBtn);

            contentWrapper.appendChild(tray);
            innerDiv.appendChild(contentWrapper);
        } else {
            contentDiv.textContent = content;
            innerDiv.appendChild(contentDiv);
        }

        msgDiv.appendChild(innerDiv);
        messageStream.appendChild(msgDiv);
        scrollToBottom();
    }

    function appendLoading() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ai-msg`;
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="message-inner">
                <div class="avatar ai-avatar">
                    <svg width="18" height="18" class="icon-loading-spin"><use href="#icon-medical"></use></svg>
                </div>
                <div class="message-content">
                    <div class="heartbeat-loader">
                        <svg viewBox="0 0 100 40" height="20" width="80">
                            <path class="heartbeat-line" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M 0 20 L 15 20 Q 18 15 22 20 L 26 20 L 30 28 L 36 5 L 44 38 L 50 20 L 60 20 Q 66 10 72 20 L 100 20"></path>
                        </svg>
                    </div>
                </div>
            </div>
        `;
        messageStream.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    // Automatic visibility checking algorithm
    chatContainer.addEventListener('scroll', () => {
        // Evaluate vertical bounds boundary offset
        const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 150;
        if(isNearBottom || chatContainer.scrollHeight <= chatContainer.clientHeight) {
            scrollDownBtn.style.display = 'none';
        } else {
            scrollDownBtn.style.display = 'flex';
        }
    });

    scrollDownBtn.addEventListener('click', scrollToBottom);

    // Initial load sequences
    async function fetchHistoryList() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            historyContainer.innerHTML = ''; 
            pinnedContainer.innerHTML = '';
            let pinnedCount = 0;

            const appendSidebarItem = (item, container) => {
                const el = document.createElement('div');
                el.className = 'history-item-container';
                
                const titleGroup = document.createElement('div');
                titleGroup.className = 'chat-title-group';
                titleGroup.innerHTML = `
                    <svg width="16" height="16"><use href="#icon-msg"></use></svg>
                    <span class="chat-title">${item.title}</span>
                `;
                titleGroup.onclick = () => {
                    loadChatMessages(item.id);
                    if (window.innerWidth <= 768) closeSidebar();
                };

                const menuDots = document.createElement('div');
                menuDots.className = 'menu-dots';
                menuDots.innerHTML = `<svg width="16" height="16"><use href="#icon-dots"></use></svg>`;
                
                menuDots.onclick = (e) => {
                    e.stopPropagation();
                    openContextMenu(e, menuDots, item.id, item.title, item.is_pinned);
                };

                el.appendChild(titleGroup);
                el.appendChild(menuDots);
                container.appendChild(el);
            };

            data.forEach(item => {
                // If it is pinned, increment count and append to Pinned box
                if (item.is_pinned) {
                    pinnedCount++;
                    appendSidebarItem(item, pinnedContainer);
                } else {
                    appendSidebarItem(item, historyContainer);
                }
            });

            // Toggle visibility of the Pinned section entirely if nothing is logically pinned
            pinnedChatsContainer.style.display = (pinnedCount > 0) ? 'block' : 'none';

        } catch (e) { console.error('History API down', e); }
    }

    async function loadChatMessages(chatId) {
        setCenteredInputState(false);
        currentChatId = chatId;
        
        // Reset container DOM text components exclusively
        messageStream.innerHTML = '';
        
        const response = await fetch(`/api/history/${chatId}`);
        const messages = await response.json();
        
        let lastUserSymptom = null;

        messages.forEach(msg => {
            if (msg.role === 'user') {
                lastUserSymptom = msg.content;
                appendMessage('user', msg.content);
            } else {
                appendMessage('ai', msg.content, lastUserSymptom);
            }
        });
    }

    // Context Menu Coordinates Mapping
    function openContextMenu(e, anchorElement, id, currentTitle, isPinned) {
        currentMenuTargetId = id;
        contextMenu.classList.remove('hidden');
        
        // Resolve absolute rendering points from browser window
        const rect = anchorElement.getBoundingClientRect();
        contextMenu.style.top = rect.bottom + 'px'; 
        contextMenu.style.left = (rect.left - 80) + 'px'; 

        // Update Pin Text logically
        const pinText = document.getElementById('pinText');
        pinText.textContent = isPinned ? 'Unpin Chat' : 'Pin Chat';

        document.getElementById('dropdownPin').onclick = async () => {
            await fetch(`/api/history/${id}/pin`, { method: 'PATCH' });
            fetchHistoryList();
            contextMenu.classList.add('hidden');
        };

        document.getElementById('dropdownRename').onclick = () => {
            renameInput.value = currentTitle;
            renameModal.classList.add('open');
            renameInput.focus();
            contextMenu.classList.add('hidden');
        };

        document.getElementById('dropdownDelete').onclick = async () => {
            if(confirm("Delete this thread permanently?")) {
                await fetch(`/api/history/${id}`, { method: 'DELETE' });
                fetchHistoryList();
                if(currentChatId === id) setCenteredInputState(true);
            }
            contextMenu.classList.add('hidden');
        };
    }

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) contextMenu.classList.add('hidden');
    });

    renameCancel.onclick = () => renameModal.classList.remove('open');
    renameSave.onclick = async () => {
        const newTitle = renameInput.value.trim();
        if(!newTitle) return;

        await fetch(`/api/history/${currentMenuTargetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        
        renameModal.classList.remove('open');
        fetchHistoryList();
    };

    function removeElement(id) { const el = document.getElementById(id); if (el) el.remove(); }
    function scrollToBottom() { chatContainer.scrollTop = chatContainer.scrollHeight; }

    toggleSidebar.addEventListener('click', () => { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); });
    function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
    sidebarOverlay.addEventListener('click', closeSidebar);
});
