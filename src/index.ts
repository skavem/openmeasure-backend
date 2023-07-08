import express from 'express'
import audit from 'express-requests-logger'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.post('/', (req, res) => {
  console.log(req.body)
  
  res.set("Connection", "close");
  res.send('ok')
  res.end()
})

app.listen(2000, () => {
  console.log('[Server]: running on port 2000')
})