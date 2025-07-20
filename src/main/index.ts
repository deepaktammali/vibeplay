import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { SettingsService } from './settings'
import { OllamaManager, ModelPullProgress } from './ollama-manager'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'VibePlay',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Settings IPC handlers
  ipcMain.handle('settings:get-all', () => {
    return SettingsService.getAllSettings()
  })

  ipcMain.handle('settings:update', (_, settings) => {
    SettingsService.updateSettings(settings)
    return SettingsService.getAllSettings()
  })

  ipcMain.handle('settings:get-ollama-url', () => {
    return SettingsService.getOllamaUrl()
  })

  ipcMain.handle('settings:get-ollama-model', () => {
    return SettingsService.getOllamaModel()
  })

  ipcMain.handle('settings:set-ollama-model', (_, model: string) => {
    SettingsService.setOllamaModel(model)
    OllamaManager.resetConnection() // Reset connection when model changes
    return SettingsService.getOllamaModel()
  })

  ipcMain.handle('settings:set-ollama-url', (_, url: string) => {
    SettingsService.setOllamaUrl(url)
    OllamaManager.resetConnection() // Reset connection when URL changes
    return SettingsService.getOllamaUrl()
  })

  // Unified AI config handlers
  ipcMain.handle('settings:get-ai-config', () => {
    return SettingsService.getAIConfig()
  })

  ipcMain.handle('settings:set-ai-config', async (_, config: any) => {
    return await SettingsService.setAIConfig(config)
  })

  // Removed separate validation and test handlers - now integrated into save process

  // Legacy AI provider settings handlers (deprecated but kept for compatibility)
  ipcMain.handle('settings:get-ai-provider', () => {
    return SettingsService.getAIProvider()
  })

  ipcMain.handle('settings:set-ai-provider', (_, provider: string) => {
    SettingsService.setAIProvider(provider as any)
    return SettingsService.getAIProvider()
  })

  ipcMain.handle('settings:get-provider-config', () => {
    return SettingsService.getProviderConfig()
  })

  ipcMain.handle('settings:set-provider-config', (_, config: any) => {
    SettingsService.setProviderConfig(config)
    return SettingsService.getProviderConfig()
  })

  ipcMain.handle('settings:validate-provider-config', async (_, config: any) => {
    return await SettingsService.validateProviderConfig(config)
  })

  // Model management handlers
  ipcMain.handle('model:check-exists', async (_, modelName: string) => {
    try {
      return await OllamaManager.checkModelExists(modelName)
    } catch (error) {
      console.error('Failed to check model existence:', error)
      throw error
    }
  })

  ipcMain.handle('model:ensure-exists', async (_, modelName: string) => {
    try {
      return await OllamaManager.ensureModelExists(modelName)
    } catch (error) {
      console.error('Failed to ensure model exists:', error)
      throw error
    }
  })

  ipcMain.handle('model:pull', async (event, modelName: string) => {
    try {
      await OllamaManager.pullModel(modelName, (progress: ModelPullProgress) => {
        // Send progress updates to renderer
        event.sender.send('model:pull-progress', progress)
      })
      return true
    } catch (error) {
      console.error('Failed to pull model:', error)
      throw error
    }
  })

  // Game handlers
  ipcMain.handle('game:process-move', async (_, gameState, move) => {
    try {
      const { gameManager } = await import('./game-manager')
      const newState = await gameManager.processMove(gameState, move)
      return newState
    } catch (error: any) {
      console.error('Failed to process move:', error)
      throw error
    }
  })

  ipcMain.handle('game:get-ai-move', async (_, gameState) => {
    try {
      const { gameManager } = await import('./game-manager')
      const aiMove = await gameManager.getAIMove(gameState)
      return aiMove
    } catch (error: any) {
      console.error('Failed to get AI move:', error)
      throw error
    }
  })

  // Legacy LLM handler (kept for backward compatibility with TicTacToe)
  ipcMain.handle('next-step', async (_, gameState) => {
    try {
      const { gameManager } = await import('./game-manager')
      const newState = await gameManager.processLegacyTicTacMove(gameState)
      return newState
    } catch (error: any) {
      console.error('Failed to generate next step:', error)
      // Preserve LLM response data for debugging in UI
      const errorToThrow = new Error(error.message)
      if (error.llmResponse) {
        (errorToThrow as any).llmResponse = error.llmResponse
      }
      if (error.errorType) {
        (errorToThrow as any).errorType = error.errorType
      }
      throw errorToThrow
    }
  })

  // Connect4 AI handler
  ipcMain.handle('connect4:ai-move', async (_, gameState) => {
    try {
      const { gameManager } = await import('./game-manager')
      const newState = await gameManager.processConnect4Move(gameState)
      return newState
    } catch (error: any) {
      console.error('Failed to generate Connect4 AI move:', error)
      // Preserve LLM response data for debugging in UI
      const errorToThrow = new Error(error.message)
      if (error.llmResponse) {
        (errorToThrow as any).llmResponse = error.llmResponse
      }
      if (error.errorType) {
        (errorToThrow as any).errorType = error.errorType
      }
      throw errorToThrow
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
