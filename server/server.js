/* eslint-disable import/no-duplicates */
import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import axios from 'axios'
import cookieParser from 'cookie-parser'
import Html from '../client/html'
// import { unlink } from 'fs'

const { writeFile, readFile, unlink } = require('fs').promises

let connections = []

const port = process.env.PORT || 3000
const server = express()

// const setHeaders = (req, res, next) => {
//   res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
//   res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
//   next()
// }

const deleteFile = async (namefile) => {
  return unlink(`${__dirname}/${namefile}`)
}

const saveFile1 = async (users, namefile) => {
  return writeFile(`${__dirname}/${namefile}`, JSON.stringify(users), { encoding: 'utf8' })
}

const readFile1 = async (namefile) => {
  return readFile(`${__dirname}/${namefile}`, { encoding: 'utf8' })
    .then((data) => JSON.parse(data))
    .catch(async () => {
      const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
      await saveFile1(users, namefile)
      return users
    })
}

server.use(cors())

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())
server.get('/api/v1/users/', async (req, res) => {
  const users = await readFile1('test.json')
  res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  res.json(users)
})

server.post('/api/v1/users/', async (req, res) => {
  let users = await readFile1('test.json')
  const newUser = req.body
  newUser.id = users[users.length - 1].id + 1
  users = [...users, newUser]
  await saveFile1(users, 'test.json')
  res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  res.json({ status: 'success', id: newUser.id })
})

server.patch('/api/v1/users/:number', async (req, res) => {
  const users = await readFile1('test.json')
  const { number } = req.params
  const modUser = req.body
  const indexModUser = users.indexOf(users.find((it) => +it.id === +number))
  users[indexModUser] = { ...users[indexModUser], ...modUser }
  await saveFile1(users, 'test.json')
  res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  res.json({ status: 'success', id: number })
})

server.delete('/api/v1/users/:number', async (req, res) => {
  const users = await readFile1('test.json')
  const { number } = req.params
  const indexModUser = users.indexOf(users.find((it) => +it.id === +number))
  users.splice(indexModUser, 1)
  await saveFile1(users, 'test.json')
  res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  res.json({ status: 'success', id: number })
})

server.delete('/api/v1/users/', async (req, res) => {
  await deleteFile('test.json')
  res.set('x-skillcrucial-user', '743160e0-31a2-4bb8-928a-3da7ee2cb896')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  res.json({ status: 'ok' })
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const echo = sockjs.createServer()
echo.on('connection', (conn) => {
  connections.push(conn)
  conn.on('data', async () => { })

  conn.on('close', () => {
    connections = connections.filter((c) => c.readyState !== 3)
  })
})

server.get('/', (req, res) => {
  // const body = renderToString(<Root />);
  const title = 'Server side Rendering'
  res.send(
    Html({
      body: '',
      title
    })
  )
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

const app = server.listen(port)

echo.installHandlers(app, { prefix: '/ws' })

// eslint-disable-next-line no-console
console.log(`Serving at http://localhost:${port}`)
