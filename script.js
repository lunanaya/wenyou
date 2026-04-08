/**
 * SillyTavern Extension Script (Client-side)
 * This script runs in the user's browser within the SillyTavern UI.
 */

import { extension_settings, getContext } from '../../../extensions.js';
import { registerSlashCommand } from '../../../slash-commands.js';

const extensionName = "wenyou-system";
const extensionFolderPath = `extensions/${extensionName}/`;

function loadExtension() {
    // Create the floating panel or sidebar button
    const sidebarButton = document.createElement('div');
    sidebarButton.id = 'wenyou-sidebar-button';
    sidebarButton.className = 'menu_button fa-solid fa-wand-magic-sparkles';
    sidebarButton.title = '文游系统';
    
    // Add to ST extensions list
    const extensionsMenu = document.getElementById('extensions_menu');
    if (extensionsMenu) {
        extensionsMenu.appendChild(sidebarButton);
    }

    sidebarButton.addEventListener('click', () => {
        openWenyouPanel();
    });

    // Register slash command
    registerSlashCommand("wenyou", () => openWenyouPanel(), [], "打开文游系统面板", true);
}

function openWenyouPanel() {
    // Check if panel already exists
    if (document.getElementById('wenyou-panel')) {
        $('#wenyou-panel').show();
        return;
    }

    // Create the panel
    const panelHtml = `
        <div id="wenyou-panel" class="draggable-panel">
            <div id="wenyou-panel-header" class="draggable-panel-header">
                <span>文游系统</span>
                <div id="wenyou-panel-close" class="fa-solid fa-xmark"></div>
            </div>
            <div id="wenyou-panel-content">
                <iframe id="wenyou-iframe" src="${window.location.origin}" style="width:100%; height:100%; border:none;"></iframe>
            </div>
        </div>
    `;

    $('body').append(panelHtml);
    
    $('#wenyou-panel-close').on('click', () => {
        $('#wenyou-panel').hide();
    });

    // Make it draggable if ST's draggable is available
    if (window.makeDraggable) {
        window.makeDraggable(document.getElementById('wenyou-panel'));
    }
}

// Initialize
$(document).ready(() => {
    loadExtension();
});
