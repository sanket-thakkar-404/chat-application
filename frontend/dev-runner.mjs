import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(frontendDir, '../backend')
const viteEntry = path.join(frontendDir, 'node_modules/vite/bin/vite.js')
const children = []

const backendIsRunning = async () => {
  try {
    const response = await fetch('http://127.0.0.1:3003/health', { signal: AbortSignal.timeout(800) })
    return response.ok
  } catch {
    return false
  }
}

if (!(await backendIsRunning())) {
  const backend = spawn(process.execPath, ['app.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
  })
  children.push(backend)
  backend.on('exit', code => {
    if (code && code !== 0) console.error(`\nChat backend stopped with exit code ${code}.`)
  })
} else {
  console.log('Chat backend is already running on http://localhost:3003')
}

const vite = spawn(process.execPath, [viteEntry, ...process.argv.slice(2)], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: process.env,
})
children.push(vite)

const shutdown = () => {
  children.forEach(child => {
    if (!child.killed) child.kill('SIGTERM')
  })
}

process.on('SIGINT', () => { shutdown(); process.exit(0) })
process.on('SIGTERM', () => { shutdown(); process.exit(0) })
vite.on('exit', code => { shutdown(); process.exit(code || 0) })
