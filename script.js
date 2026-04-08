/**
 * SillyTavern Extension Script (Client-side)
 * Wenyou System - Embedded Integration
 */

(function() {
    const extensionName = "wenyou";

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
                        <iframe id="wenyou-embedded-iframe" src="${window.location.origin}"></iframe>
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
    }

    $(document).ready(() => {
        setupSettings();
    });
})();
