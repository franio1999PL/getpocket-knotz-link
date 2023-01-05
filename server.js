import auth from 'pocket-auth'
import express from 'express'
import cors from 'cors'
import GetPocket from 'node-getpocket'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()
app.use(cors())

var consumerKey = process.env.CONSUMER_KEY
var redirectUri = 'https://google.com'

auth.fetchToken(consumerKey, redirectUri, {}, function (err, code) {
  let uri = auth.getRedirectUrl(code.code, redirectUri)
  console.log(
    'Visit the following URL and click approve in the next 60 seconds:'
  )
  console.log(uri)

  setTimeout(async function () {
    auth.getAccessToken(consumerKey, code.code, function (err, r) {
      if (err) {
        console.log(
          "You didn't click the link and approve the application in time"
        )
        return
      }

      //start code
      const { access_token } = r

      const config = {
        consumer_key: process.env.CONSUMER_KEY,
        access_token: access_token
      }
      const pocket = new GetPocket(config)

      const params = {
        // get/retrieve/search parameters
        favorite: 1,
        count: 1000,
        sort: 'oldest'
      }
      pocket.get(params, (err, resp) => {
        if (err) {
          console.log(err)
          return
        }
        return resp
      })
    })
  }, 10000)
})

app.get('/', (req, res) => {
  const config = {
    consumer_key: process.env.CONSUMER_KEY,
    access_token: process.env.ACCESS_KEY
  }
  const pocket = new GetPocket(config)

  const params = {
    // get/retrieve/search parameters
    favorite: 1,
    count: 1000,
    sort: 'newest'
  }
  pocket.get(params, (err, resp) => {
    if (err) {
      console.log(err)
      return
    }

    const items = resp.list
    const modifiedData = Object.values(items).map(
      ({ item_id, has_image, given_url, resolved_title, excerpt }) => ({
        item_id,
        has_image,
        given_url,
        resolved_title,
        excerpt
      })
    )
    res.send(modifiedData)
  })
})

app.get('*', (req, res) => {
  res.send({ code: 404, error: 'Not Found' })
})
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
