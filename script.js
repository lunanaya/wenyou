/**
 * SillyTavern Extension Script (Client-side)
 * This script runs in the user's browser within the SillyTavern UI.
 */

import { extension_settings, getContext } from '../../../extensions.js';
import { registerSlashCommand } from '../../../slash-commands.js';

const extensionName = "wenyou-system";
const extensionFolderPath = `extensions/${extensionName}/`;
const defaultSettings = {
    isEnabled: false,
};

function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
}

function onSettingsClick() {
    const settingsHtml = `
        <div class="wenyou-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-header">
                    <b>文游系统设置</b>
                </div>
                <div class="inline-drawer-content" style="padding: 10px;">
                    <div class="flex-container">
                        <label for="wenyou-enabled">启用文游系统 (魔法棒按钮)</label>
                        <input type="checkbox" id="wenyou-enabled" ${extension_settings[extensionName].isEnabled ? 'checked' : ''}>
                    </div>
                    <p style="font-size: 0.8em; opacity: 0.8; margin-top: 10px;">
                        启用后，魔法棒（生成按钮）中会出现文游系统选项。
                    </p>
                </div>
            </div>
        </div>
    `;

    $('#extension_settings_wenyou').remove();
    const settingsElement = $(settingsHtml);
    settingsElement.attr('id', 'extension_settings_wenyou');
    $('#extensions_settings').append(settingsElement);

    $('#wenyou-enabled').on('change', function() {
        extension_settings[extensionName].isEnabled = !!$(this).prop('checked');
        saveSettingsDebounced();
        updateWandButton();
    });
}

function updateWandButton() {
    const isEnabled = extension_settings[extensionName].isEnabled;
    let wandButton = document.getElementById('wenyou-wand-button');

    if (isEnabled) {
        if (!wandButton) {
            wandButton = document.createElement('div');
            wandButton.id = 'wenyou-wand-button';
            wandButton.className = 'menu_button fa-solid fa-wand-magic-sparkles';
            wandButton.title = '文游系统';
            
            // Add to the magic wand menu (usually where other generation tools are)
            const extensionsMenu = document.getElementById('extensions_menu');
            if (extensionsMenu) {
                extensionsMenu.appendChild(wandButton);
            }

            wandButton.addEventListener('click', () => {
                openWenyouPanel();
            });
        }
    } else {
        if (wandButton) {
            wandButton.remove();
        }
    }
}

function openWenyouPanel() {
    if (document.getElementById('wenyou-panel')) {
        $('#wenyou-panel').toggle();
        return;
    }

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

    if (window.makeDraggable) {
        window.makeDraggable(document.getElementById('wenyou-panel'));
    }
}

$(document).ready(() => {
    loadSettings();
    updateWandButton();
    
    // Register in the three-dot/extensions menu
    const extensionsMenu = document.getElementById('extensions_settings');
    if (extensionsMenu) {
        const menuHeader = document.createElement('div');
        menuHeader.className = 'extensions-settings-header';
        menuHeader.innerText = '文游系统';
        menuHeader.addEventListener('click', onSettingsClick);
        // This is a bit hacky, ST usually populates this automatically if manifest is right
        // but we can force a registration call if needed.
    }

    registerSlashCommand("wenyou", () => openWenyouPanel(), [], "打开文游系统面板", true);
});
