import 'dotenv/config'
import express from 'express'
import aiRouter from './routes/ai'
import { errorHandler } from './middleware/errors'

const app = express()
const port = Number(process.env.PORT || 8787)

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
  })
})

app.use('/api/ai', aiRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`AI server listening on http://localhost:${port}`)
})
