/**
 * 文游系统 (Wenyou) - SillyTavern 插件
 * 纯 JavaScript 实现，集成在“小魔法棒”菜单中
 */

(function() {
    // --- 核心配置与状态 ---
    const extensionName = "wenyou-system";
    const extensionPath = `/extensions/${extensionName}/`;
    
    let settings = {
        apiKey: '',
        model: 'gemini-1.5-flash',
        autoSync: true,
        configs: {
            user_plan: {
                name: '个人计划',
                promptTemplate: '基于当前上下文，为角色生成5个可能的下一步行动计划。目的：{{purpose}}。上下文：{{context}}',
                isActive: true
            },
            side_quest: {
                name: '支线触发',
                promptTemplate: '基于当前上下文，生成5个可能触发的支线任务或突发事件。目的：{{purpose}}。上下文：{{context}}',
                isActive: true
            },
            main_story: {
                name: '主线推进',
                promptTemplate: '基于当前上下文，生成5个推进主线剧情的关键转折点。目的：{{purpose}}。上下文：{{context}}',
                isActive: true
            }
        }
    };

    let currentOptions = [];
    let isGenerating = false;

    // --- 工具函数 ---
    function saveSettings() {
        SillyTavern.Context.setExtensionSettings(extensionName, settings);
    }

    function loadSettings() {
        const saved = SillyTavern.Context.getExtensionSettings(extensionName);
        if (saved) {
            settings = Object.assign(settings, saved);
        }
    }

    // --- UI 构建 ---
    function createModal() {
        if ($('#wenyou-modal-container').length) return;

        const modalHtml = `
            <div id="wenyou-modal-container">
                <div id="wenyou-modal">
                    <div class="wenyou-header">
                        <h2><i class="fa-solid fa-wand-magic-sparkles"></i> 文游系统 (Wenyou)</h2>
                        <div class="wenyou-close"><i class="fa-solid fa-xmark"></i></div>
                    </div>
                    <div class="wenyou-content">
                        <div class="wenyou-tabs">
                            <div class="wenyou-tab active" data-tab="generate">生成</div>
                            <div class="wenyou-tab" data-tab="settings">设置</div>
                        </div>

                        <!-- 生成面板 -->
                        <div id="wenyou-tab-generate" class="wenyou-section active">
                            <div class="wenyou-input-group">
                                <label>意图引导 (可选)</label>
                                <input type="text" id="wenyou-purpose" placeholder="例如：寻找破局线索 / 搞钱 / 调查某事">
                            </div>
                            <div class="wenyou-btn-grid">
                                <button class="wenyou-btn primary" data-mode="user_plan">
                                    <i class="fa-solid fa-person-walking"></i> 生成个人计划
                                </button>
                                <button class="wenyou-btn" data-mode="side_quest">
                                    <i class="fa-solid fa-route"></i> 生成支线触发
                                </button>
                                <button class="wenyou-btn" data-mode="main_story">
                                    <i class="fa-solid fa-scroll"></i> 生成主线推进
                                </button>
                            </div>
                            <div id="wenyou-results" class="wenyou-results">
                                <!-- 结果卡片将插入此处 -->
                            </div>
                        </div>

                        <!-- 设置面板 -->
                        <div id="wenyou-tab-settings" class="wenyou-section">
                            <div class="wenyou-input-group">
                                <label>Gemini API Key</label>
                                <input type="password" id="wenyou-api-key" placeholder="输入您的 API Key">
                            </div>
                            <div class="wenyou-input-group">
                                <label>模型选择</label>
                                <select id="wenyou-model">
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (推荐: 快且免费)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (更强但慢)</option>
                                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                                </select>
                            </div>
                            <button id="wenyou-save-settings" class="wenyou-btn primary" style="width:100%">保存设置</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        // 事件绑定
        $('.wenyou-close').on('click', hideModal);
        $('#wenyou-modal-container').on('click', function(e) {
            if (e.target === this) hideModal();
        });

        $('.wenyou-tab').on('click', function() {
            const tab = $(this).data('tab');
            $('.wenyou-tab').removeClass('active');
            $(this).addClass('active');
            $('.wenyou-section').removeClass('active');
            $(`#wenyou-tab-${tab}`).addClass('active');
        });

        $('.wenyou-btn[data-mode]').on('click', function() {
            const mode = $(this).data('mode');
            handleGenerate(mode);
        });

        $('#wenyou-save-settings').on('click', function() {
            settings.apiKey = $('#wenyou-api-key').val();
            settings.model = $('#wenyou-model').val();
            saveSettings();
            toastr.success('设置已保存');
        });
    }

    function showModal() {
        createModal();
        loadSettings();
        $('#wenyou-api-key').val(settings.apiKey);
        $('#wenyou-model').val(settings.model);
        $('#wenyou-modal-container').css('display', 'flex');
    }

    function hideModal() {
        $('#wenyou-modal-container').hide();
    }

    // --- 核心逻辑 ---
    async function handleGenerate(mode) {
        if (isGenerating) return;
        if (!settings.apiKey) {
            toastr.error('请先在设置中配置 Gemini API Key');
            return;
        }

        const purpose = $('#wenyou-purpose').val() || "完全随机。请结合当前局势，自行给角色派发一个高优级的短期目标。";
        const context = getChatContext();
        
        if (!context) {
            toastr.warning('未检测到聊天上下文');
            return;
        }

        isGenerating = true;
        updateLoadingState(true, mode);

        try {
            const config = settings.configs[mode];
            const prompt = buildPrompt(context, config, purpose);
            const results = await callGemini(prompt);
            
            renderResults(results, mode);
        } catch (error) {
            console.error('Generation failed:', error);
            toastr.error('生成失败，请检查网络或 API Key');
        } finally {
            isGenerating = false;
            updateLoadingState(false, mode);
        }
    }

    function getChatContext() {
        const context = SillyTavern.Context.getContext();
        if (!context || !context.chat || context.chat.length === 0) return null;
        
        // 获取最后15条消息
        return context.chat.slice(-15).map(m => `${m.name}: ${m.mes}`).join('\n');
    }

    function buildPrompt(context, config, purpose) {
        const template = config.promptTemplate
            .replace("{{purpose}}", purpose)
            .replace("{{context}}", context);

        return `
当前故事上下文：
${context}

任务指令：
${template}

输出要求：
必须输出一个 JSON 数组，包含五个对象。每个对象必须包含：
- "title": 选项的简短标题
- "description": 选项的详细剧情描述（100-200字）

严格遵守 JSON 格式，不要输出任何解释性文字。
        `.trim();
    }

    async function callGemini(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API Request Failed');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    }

    function renderResults(results, mode) {
        const container = $('#wenyou-results');
        container.empty();

        results.forEach((item, index) => {
            const badgeClass = mode === 'user_plan' ? 'wenyou-badge-user' : (mode === 'side_quest' ? 'wenyou-badge-side' : 'wenyou-badge-main');
            const cardHtml = `
                <div class="wenyou-card" data-index="${index}">
                    <div class="wenyou-card-header">
                        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                            <span class="wenyou-badge ${badgeClass}">${settings.configs[mode].name}</span>
                            <b style="font-size:0.9em; truncate">${item.title}</b>
                        </div>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="wenyou-card-content">
                        <div class="wenyou-text">${item.description}</div>
                        <div class="wenyou-card-actions">
                            <button class="wenyou-btn primary wenyou-copy-btn" style="flex:1; font-size:0.8em; padding:5px;">
                                <i class="fa-solid fa-copy"></i> 复制并粘贴
                            </button>
                            <button class="wenyou-btn wenyou-remove-btn" style="padding:5px 10px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.append(cardHtml);
        });

        // 绑定卡片事件
        $('.wenyou-card-header').on('click', function() {
            $(this).parent().toggleClass('active');
            $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
        });

        $('.wenyou-copy-btn').on('click', function() {
            const text = $(this).closest('.wenyou-card').find('.wenyou-text').text();
            navigator.clipboard.writeText(text);
            toastr.success('已复制到剪贴板，请手动粘贴至输入框');
        });

        $('.wenyou-remove-btn').on('click', function() {
            $(this).closest('.wenyou-card').remove();
        });
    }

    function updateLoadingState(loading, mode) {
        const btn = $(`.wenyou-btn[data-mode="${mode}"]`);
        if (loading) {
            btn.prop('disabled', true);
            btn.find('i').addClass('wenyou-spin');
            btn.append(' <span class="loading-text">...生成中</span>');
        } else {
            btn.prop('disabled', false);
            btn.find('i').removeClass('wenyou-spin');
            btn.find('.loading-text').remove();
        }
    }

    // --- 插件初始化 ---
    function init() {
        loadSettings();
        
        // 添加到小魔法棒菜单 (Extensions Menu)
        const iconHtml = `
            <div id="wenyou-menu-button" class="list-group-item flex-container flex-align-center" title="文游系统">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <div class="extension_menu_text">文游系统</div>
            </div>
        `;
        $('#extensions_menu').append(iconHtml);
        $('#wenyou-menu-button').on('click', showModal);

        console.log('文游系统 (Wenyou) 已加载至小魔法棒菜单');
    }

    $(document).ready(init);
})();
