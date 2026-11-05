import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function checkPortListening(port, host = '127.0.0.1', timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false
    const finish = (result) => {
      if (!settled) {
        settled = true
        socket.destroy()
        resolve(result)
      }
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, host)
  })
}

function autoStartDotnetBackendPlugin() {
  let backendProcess = null

  return {
    name: 'geoquest-auto-start-dotnet-backend',
    configureServer(server) {
      checkPortListening(5208, '127.0.0.1').then((isListening) => {
        if (isListening || backendProcess) return

        const backendDir = path.resolve(__dirname, '..', 'Backend')
        backendProcess = spawn(
          'dotnet',
          ['run', '--urls', 'http://127.0.0.1:5208'],
          {
            cwd: backendDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          }
        )

        // Keep the last lines of output so a startup crash is visible instead of
        // surfacing only as "ECONNREFUSED 127.0.0.1:5208" proxy errors.
        const recentOutput = []
        const collect = (chunk) => {
          recentOutput.push(...chunk.toString().split(/\r?\n/).filter(Boolean))
          if (recentOutput.length > 40) recentOutput.splice(0, recentOutput.length - 40)
        }
        backendProcess.stdout.on('data', collect)
        backendProcess.stderr.on('data', collect)

        backendProcess.on('error', (err) => {
          server.config.logger.error(`[geoquest] Falha ao iniciar o backend (dotnet): ${err.message}`)
          backendProcess = null
        })

        backendProcess.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            server.config.logger.error(
              `[geoquest] O backend .NET encerrou com código ${code}. Últimas linhas:\n${recentOutput.join('\n')}`
            )
          }
          backendProcess = null
        })

        server.httpServer?.once('close', () => {
          if (backendProcess && !backendProcess.killed) {
            backendProcess.kill()
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoStartDotnetBackendPlugin()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5208',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
})
