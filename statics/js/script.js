const { remote } = require('electron');
const currentWindow = remote.getCurrentWindow();

// Điều khiển các nút
document.getElementById('minimize').addEventListener('click', () => {
    currentWindow.minimize();
});

document.getElementById('maximize').addEventListener('click', () => {
    if (currentWindow.isMaximized()) {
    currentWindow.unmaximize();
    } else {
    currentWindow.maximize();
    }
});

document.getElementById('close').addEventListener('click', () => {
    
    console.log("Cutttttt")
    currentWindow.close();
});