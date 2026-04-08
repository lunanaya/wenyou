/**
 * SillyTavern Extension Script (Client-side)
 * Wenyou System - Standard Integration
 */

(function() {
    const extensionName = "wenyou";
    let isEnabled = false;

    // 1. 使用酒馆标准折叠面板结构 (inline-drawer)
    function setupSettings() {
        const html = `
            <div id="wenyou-settings-wrapper" class="inline-drawer">
                <div class="inline-drawer-header">
                    <b>文游系统 (Wenyou)</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="wenyou-settings-body">
                        <p>身份驱动的故事逻辑生成器，专为深度文游设计。</p>
                        <div class="flex-container">
                            <button id="wenyou-toggle-btn" class="menu_button">点击启用文游系统</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('#extensions_settings').append(html);

        // 处理酒馆自带的折叠逻辑
        $('#wenyou-settings-wrapper .inline-drawer-header').on('click', function() {
            const drawer = $(this).closest('.inline-drawer');
            drawer.toggleClass('inline-drawer-active');
            const icon = $(this).find('.inline-drawer-icon');
            icon.toggleClass('fa-circle-chevron-down fa-circle-chevron-up');
        });

        $('#wenyou-toggle-btn').on('click', function(e) {
            e.stopPropagation(); // 防止触发折叠
            isEnabled = !isEnabled;
            if (isEnabled) {
                $(this).text('系统已启用').addClass('success');
                addQuickMenuIcon();
            } else {
                $(this).text('点击启用文游系统').removeClass('success');
                removeQuickMenuIcon();
                $('#wenyou-floating-panel').hide();
            }
        });
    }

    // 2. 修正魔法棒（快捷菜单）图标位置
    function addQuickMenuIcon() {
        if ($('#wenyou-quick-icon').length) return;

        // 酒馆快捷菜单的标准图标结构
        const iconHtml = `
            <div id="wenyou-quick-icon" class="fa-solid fa-wand-magic-sparkles quick_menu_button" title="开启文游织梦"></div>
        `;
        
        // 优先寻找魔法棒快捷菜单栏
        const quickMenu = $('#quick_menu');
        if (quickMenu.length) {
            quickMenu.append(iconHtml);
        } else {
            // 备选方案：添加到侧边扩展栏
            $('#extensions_menu').append(iconHtml);
        }

        $('#wenyou-quick-icon').on('click', function() {
            toggleFloatingPanel();
        });
    }

    function removeQuickMenuIcon() {
        $('#wenyou-quick-icon').remove();
    }

    // 3. 极简浮窗逻辑
    function toggleFloatingPanel() {
        let panel = $('#wenyou-floating-panel');
        if (panel.length === 0) {
            const panelHtml = `
                <div id="wenyou-floating-panel">
                    <div id="wenyou-panel-drag" class="fa-solid fa-grip-lines"></div>
                    <div id="wenyou-panel-close" class="fa-solid fa-circle-xmark"></div>
                    <iframe id="wenyou-iframe" src="${window.location.origin}"></iframe>
                </div>
            `;
            $('body').append(panelHtml);
            panel = $('#wenyou-floating-panel');

            // 拖拽功能
            if (window.makeDraggable) {
                window.makeDraggable(panel[0]);
            }

            $('#wenyou-panel-close').on('click', () => panel.hide());
        }

        panel.toggle();
    }

    $(document).ready(() => {
        setupSettings();
    });
})();
