const { healthService } = require('../services/healthService')

function getHealth(req, res) {
  const data = healthService()
  res.json(data)
}

module.exports = { getHealth }
