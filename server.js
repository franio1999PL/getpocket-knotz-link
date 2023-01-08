const auth = require('pocket-auth')
const express = require('express')
const cors = require('cors')
const GetPocket = require('node-getpocket')
const dotenv = require('dotenv')
const sgMail = require('@sendgrid/mail')

dotenv.config()

const PORT = process.env.PORT || 3000

// Load instance of express app
const app = express()
app.use(cors())

// Konfiguracja SENDGRID
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

app.get('/', (req, res) => {
  // Konfiuracja do pobrania artykułów z getpocket api
  const config = {
    consumer_key: process.env.CONSUMER_KEY,
    access_token: process.env.ACCESS_KEY
  }

  const pocket = new GetPocket(config)

  const params = {
    favorite: 1,
    count: 1000,
    sort: 'newest',
    detailType: 'complete'
  }
  pocket.get(params, (err, resp) => {
    if (err) {
      console.log(err)

      const emailNotification = {
        to: 'sikorafranek@gmail.com',
        from: 'no-reply@blady.dev',
        subject: 'Problem z API knotz.link',
        text: `
          Problem z autoryzacja access_key do api getpocket.com
          
          Pełny error msg: ${err}
        `,
        html: `<strong>
        Problem z autoryzacja access_key do api getpocket.com
        
        Pełny error msg: ${err}</strong>
      `
      }

      sgMail
        .send(emailNotification)
        .then(response => {
          // console.log(response[0].statusCode)
          // console.log(response[0].headers)
          console.log('Wysłano wiadomość informacyjną o problemie z API')
        })
        .catch(error => {
          console.error(error)
        })

      res.status(401).send({
        error: '401',
        message: 'Error with authorization (unknown access token)'
      })
      return
    }

    const items = resp.list
    const modifiedData = Object.values(items).map(
      ({
        item_id: id,
        given_url: url,
        resolved_title: title,
        excerpt: description,
        time_favorited: time_added,
        time_to_read: read_time,
        word_count,
        tags
      }) => ({
        id,
        url,
        title,
        description,
        time_added,
        read_time,
        word_count,
        tags
      })
    )
    res.send(modifiedData)
  })
})

app.get('/categories', (req, res) => {
  const tag = req.query.tag
  const count = req.query.count

  const config = {
    consumer_key: process.env.CONSUMER_KEY,
    access_token: process.env.ACCESS_KEY
  }
  const pocket = new GetPocket(config)

  const params = {
    favorite: 1,
    tag,
    count
    // sort: 'newest',
    // detailType: 'complete'
  }
  pocket.get(params, (err, resp) => {
    if (err) {
      console.log(err)
      return
    }

    const items = resp.list
    const modifiedData = Object.values(items).map(
      ({
        item_id: id,
        given_url: url,
        resolved_title: title,
        excerpt: description,
        time_favorited: time_added,
        time_to_read: read_time,
        word_count,
        tags
      }) => ({
        id,
        url,
        title,
        description,
        time_added,
        read_time,
        word_count,
        tags
      })
    )
    res.send(modifiedData)
  })
})

app.get('*', (req, res) => {
  res.send({ code: 404, error: 'Not Found' })
})
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
