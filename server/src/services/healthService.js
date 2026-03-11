function healthService() {
  return {
    status: 'ok',
    message: 'Server healthy',
    timestamp: new Date().toISOString()
  }
}

module.exports = { healthService }
