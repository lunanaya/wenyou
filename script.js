/**
 * 文游系统 (Wenyou) - SillyTavern 插件
 * 修复版：适配真实的 SillyTavern API
 */

// 使用自执行函数避免污染全局变量空间
(function() {
    // --- 核心配置与状态 ---
    const extensionName = "wenyou-system";
    
    // 初始化或读取酒馆的扩展设置
    // extension_settings 是 SillyTavern 的全局变量
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {
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
    }
    
    // 引用全局设置以便调用
    let settings = extension_settings[extensionName];
    let isGenerating = false;

    // --- 工具函数 ---
    function saveSettings() {
        // 同步修改到全局对象并调用酒馆自带的防抖保存函数
        extension_settings[extensionName] = settings;
        if (typeof saveSettingsDebounced === 'function') {
            saveSettingsDebounced();
        }
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
            toastr.warning('未检测到聊天上下文，请先开始对话。');
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
            console.error('文游系统生成失败:', error);
            toastr.error('生成失败，请检查网络环境或 API Key。详细信息看控制台。');
        } finally {
            isGenerating = false;
            updateLoadingState(false, mode);
        }
    }

    function getChatContext() {
        // 使用 SillyTavern 全局函数 getContext() 获取上下文
        const context = typeof getContext === 'function' ? getContext() : null;
        if (!context || !context.chat || context.chat.length === 0) return null;
        
        // 获取最后15条消息，过滤掉系统提示词等非对话内容
        const recentMessages = context.chat.slice(-15).filter(m => m.is_system !== true);
        if (recentMessages.length === 0) return null;

        // 格式化为 "角色名: 对话内容" 的纯文本形式
        return recentMessages.map(m => {
            // 将可能存在的 HTML 标签简单剔除，防止干扰 AI
            const plainTextMes = m.mes.replace(/<[^>]*>?/gm, '');
            return `${m.name}: ${plainTextMes}`;
        }).join('\n');
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

严格遵守 JSON 格式，不要输出任何解释性文字或 Markdown 代码块标记（如 \`\`\`json ）。
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
        
        // 尝试解析 JSON（处理 AI 偶尔带上 Markdown 代码块的情况）
        try {
            const cleanText = text.replace(/^```json/im, '').replace(/```$/im, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON 解析失败，返回的文本为:", text);
            throw new Error("AI 返回的格式不正确，不是有效的 JSON");
        }
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
                            <b style="font-size:0.9em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.title}</b>
                        </div>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="wenyou-card-content">
                        <div class="wenyou-text">${item.description}</div>
                        <div class="wenyou-card-actions">
                            <button class="wenyou-btn primary wenyou-copy-btn" style="flex:1; font-size:0.8em; padding:5px;">
                                <i class="fa-solid fa-copy"></i> 复制并修改
                            </button>
                            <button class="wenyou-btn wenyou-send-btn" style="flex:1; font-size:0.8em; padding:5px; background: var(--greenColor);">
                                <i class="fa-solid fa-paper-plane"></i> 发送
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
        $('.wenyou-card-header').off('click').on('click', function() {
            $(this).parent().toggleClass('active');
            $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
        });

        // 复制到输入框的事件
        $('.wenyou-copy-btn').off('click').on('click', function() {
            const text = $(this).closest('.wenyou-card').find('.wenyou-text').text();
            // 获取酒馆底部的输入框并填入内容
            $('#send_textarea').val($('#send_textarea').val() + text).trigger('input');
            toastr.success('已填入输入框，您可以进一步修改。');
        });

        // 直接作为用户消息发送的事件
        $('.wenyou-send-btn').off('click').on('click', function() {
            const text = $(this).closest('.wenyou-card').find('.wenyou-text').text();
            // 调用酒馆的发送消息逻辑
            $('#send_textarea').val(text).trigger('input');
            $('#send_but').click();
            toastr.success('已发送剧情选项！');
        });

        $('.wenyou-remove-btn').off('click').on('click', function() {
            $(this).closest('.wenyou-card').remove();
        });
    }

    function updateLoadingState(loading, mode) {
        const btn = $(`.wenyou-btn[data-mode="${mode}"]`);
        if (loading) {
            btn.prop('disabled', true);
            btn.find('i').addClass('wenyou-spin');
            btn.append('<span class="loading-text" style="margin-left:5px;">...</span>');
        } else {
            btn.prop('disabled', false);
            btn.find('i').removeClass('wenyou-spin');
            btn.find('.loading-text').remove();
        }
    }

    // --- 插件UI初始化 ---
    function setupSettings() {
        if ($('#wenyou-settings-wrapper').length) return;

        const html = `
            <div id="wenyou-settings-wrapper" class="inline-drawer">
                <div class="inline-drawer-header">
                    <b><i class="fa-solid fa-wand-magic-sparkles"></i> 文游系统 (Wenyou)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="wenyou-settings-body" style="padding:15px;">
                        <div class="wenyou-tabs">
                            <div class="wenyou-tab active" data-tab="generate">生成</div>
                            <div class="wenyou-tab" data-tab="settings">设置</div>
                        </div>

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
                                </div>
                        </div>

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
        $('#extensions_settings').append(html);

        // 绑定事件之前先解绑，防止热重载时重复触发
        $('.wenyou-tab').off('click').on('click', function() {
            const tab = $(this).data('tab');
            $('.wenyou-tab').removeClass('active');
            $(this).addClass('active');
            $('.wenyou-section').removeClass('active');
            $(`#wenyou-tab-${tab}`).addClass('active');
        });

        $('.wenyou-btn[data-mode]').off('click').on('click', function() {
            const mode = $(this).data('mode');
            handleGenerate(mode);
        });

        $('#wenyou-save-settings').off('click').on('click', function() {
            settings.apiKey = $('#wenyou-api-key').val();
            settings.model = $('#wenyou-model').val();
            saveSettings();
            toastr.success('文游系统设置已保存');
        });

        // 处理酒馆自带的折叠逻辑
        $('#wenyou-settings-wrapper .inline-drawer-header').off('click').on('click', function() {
            const drawer = $(this).closest('.inline-drawer');
            drawer.toggleClass('inline-drawer-toggle inline-drawer-hidden');
            const icon = $(this).find('.inline-drawer-icon');
            icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
        });
        
        // 初始化设置值
        $('#wenyou-api-key').val(settings.apiKey);
        $('#wenyou-model').val(settings.model);
    }

    // 确保在酒馆 DOM 加载完成后运行
    $(document).ready(() => {
        setupSettings();
        console.log('文游系统 (Wenyou) 修复版已加载');
    });
})();
