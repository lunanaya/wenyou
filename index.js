/**
 * SillyTavern Extension Entry Point
 * Loads the compiled Wenyou React app.
 */

(function() {
    console.log("Wenyou Extension Loading...");
    
    // 动态加载编译后的 JS
    const script = document.createElement('script');
    script.src = '/extensions/wenyou/dist/wenyou.iife.js';
    script.onload = () => console.log("Wenyou App Loaded Successfully");
    document.head.appendChild(script);
})();
