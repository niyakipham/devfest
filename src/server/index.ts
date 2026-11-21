import { createApp } from './app'

const PORT = Number(process.env.PORT ?? 4000)

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`[hanoi-legends] API listening on http://0.0.0.0:${PORT}`)
})
