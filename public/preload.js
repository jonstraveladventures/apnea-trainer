const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  saveProfileAs: (profileData) => ipcRenderer.invoke('save-profile-as', profileData),
  loadProfileFromFile: () => ipcRenderer.invoke('load-profile-from-file'),
}); 