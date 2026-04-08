/**
 * SillyTavern Extension Script (Client-side)
 * Wenyou System - Deep Integration
 */

(function() {
    const extensionName = "wenyou";
    let isEnabled = false;

    // 1. 在“三个小方块”（扩展设置）中添加菜单
    function setupSettings() {
        const html = `
            <div class="wenyou-settings">
                <h4>文游系统 (Wenyou)</h4>
                <p>身份驱动的故事逻辑生成器</p>
                <div class="flex-container">
                    <button id="wenyou-toggle-btn" class="menu_button">点击启用文游系统</button>
                </div>
            </div>
        `;
        $('#extensions_settings').append(html);

        $('#wenyou-toggle-btn').on('click', function() {
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

    // 2. 在“魔法棒”（快捷菜单）中添加图标
    function addQuickMenuIcon() {
        if ($('#wenyou-quick-icon').length) return;

        const iconHtml = `
            <div id="wenyou-quick-icon" class="fa-solid fa-wand-magic-sparkles" title="开启文游织梦"></div>
        `;
        
        // 尝试添加到快捷菜单栏 (Quick Menu)
        const quickMenu = $('#quick_menu');
        if (quickMenu.length) {
            quickMenu.append(iconHtml);
        } else {
            // 如果找不到快捷菜单，添加到侧边栏作为备选
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
