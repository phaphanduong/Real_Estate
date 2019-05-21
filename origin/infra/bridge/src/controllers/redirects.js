'use strict'

const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/facebook', async (req, res) => {
  const sessionID = req.query.state
  if (sessionID) {
    const session = await req.sessionStore.get(sessionID)
    if (!session) {
      return res.status(400).send('Session not found')
    }

    req.session.code = session.code = req.query.code
    await req.sessionStore.set(sessionID, session)

    res.redirect(`${session.redirect}?sid=${sessionID}`)
  } else {
    // res.sendFile requires absoluite paths and ../ is considered malicious
    // so resolve first
    res.sendFile(path.resolve(`${__dirname}/../static/facebook.html`))
  }
})

router.get('/twitter', async (req, res) => {
  const sessionID = req.query.state

  if (sessionID) {
    const session = await req.sessionStore.get(sessionID)
    if (!session) {
      return res.status(400).send('Session not found')
    }

    req.session.code = session.code = req.query.oauth_verifier
    await req.sessionStore.set(sessionID, session)

    res.redirect(`${session.redirect}?sid=${sessionID}`)
  } else {
    // res.sendFile requires absoluite paths and ../ is considered malicious
    // so resolve first
    res.sendFile(path.resolve(`${__dirname}/../static/twitter.html`))
  }
})

router.get('/google', async (req, res) => {
  const sessionID = req.query.state

  if (sessionID) {
    const session = await req.sessionStore.get(sessionID)
    if (!session) {
      return res.status(400).send('Session not found')
    }

    req.session.code = session.code = req.query.code
    await req.sessionStore.set(sessionID, session)

    res.redirect(`${session.redirect}?sid=${sessionID}`)
  } else {
    // res.sendFile requires absoluite paths and ../ is considered malicious
    // so resolve first
    res.sendFile(path.resolve(`${__dirname}/../static/google.html`))
  }
})

module.exports = router
