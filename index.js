var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-web-window', 'WebWindow', WebWindow)
}

function WebWindow (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute
  this.pollInterval = config.pollInterval || 300

  this.port = config.port || 2000
  this.requestArray = ['currentPosition', 'targetPosition', 'positionState']

  this.autoReset = config.autoReset || false
  this.autoResetDelay = config.autoResetDelay || 5

  this.manufacturer = config.manufacturer || packageJson.author
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.username = config.username || null
  this.password = config.password || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  if (this.username != null && this.password != null) {
    this.auth = {
      user: this.username,
      pass: this.password
    }
  }

  this.server = http.createServer(function (request, response) {
    var baseURL = 'http://' + request.headers.host + '/'
    var url = new URL(request.url, baseURL)
    if (this.requestArray.includes(url.pathname.substr(1))) {
      this.log.debug('Handling request')
      response.end('Handling request')
      this._httpHandler(url.pathname.substr(1), url.searchParams.get('value'))
    } else {
      this.log.warn('Invalid request: %s', request.url)
      response.end('Invalid request')
    }
  }.bind(this))

  this.server.listen(this.port, function () {
    this.log('Listen server: http://%s:%s', ip.address(), this.port)
  }.bind(this))

  this.service = new Service.Window(this.name)
}

WebWindow.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/status'
    this.log.debug('Getting status: %s', url)

    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting status: %s', error.message)
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(new Error('Polling failed'))
        callback(error)
      } else {
        this.log.debug('Device response: %s', responseBody)
        try {
          var json = JSON.parse(responseBody)
          this.service.getCharacteristic(Characteristic.PositionState).updateValue(json.positionState)
          this.log.debug('Updated positionState to: %s', json.positionState)
          this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(json.currentPosition)
          this.log.debug('Updated currentPosition to: %s', json.currentPosition)
          this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(json.targetPosition)
          this.log.debug('Updated targetPosition to: %s', json.targetPosition)
          callback()
        } catch (e) {
          this.log.warn('Error parsing status: %s', e.message)
        }
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'positionState':
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'currentPosition':
        this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetPosition':
        this.service.getCharacteristic(Characteristic.TargetPosition).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'obstructionDetected':
        this.service.getCharacteristic(Characteristic.ObstructionDetected).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        if (parseInt(value) === 1 && this.autoReset) {
          this.autoResetFunction()
        }
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setTargetPosition: function (value, callback) {
    var url = this.apiroute + '/setTargetPosition?value=' + value
    this.log.debug('Setting targetPosition: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetPosition: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetPosition to %s', value)
        callback()
      }
    }.bind(this))
  },

  autoResetFunction: function () {
    this.log('Waiting %s seconds to autoreset obstruction detection', this.autoResetDelay)
    setTimeout(() => {
      this.service.getCharacteristic(Characteristic.ObstructionDetected).updateValue(0)
      this.log('Autoreset obstruction detection')
    }, this.autoResetDelay * 1000)
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service
      .getCharacteristic(Characteristic.TargetPosition)
      .on('set', this.setTargetPosition.bind(this))

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }

}
