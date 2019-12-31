# homebridge-web-window _UNDER DEVELOPMENT_

[![npm](https://img.shields.io/npm/v/homebridge-web-window.svg)](https://www.npmjs.com/package/homebridge-web-window) [![npm](https://img.shields.io/npm/dt/homebridge-web-window.svg)](https://www.npmjs.com/package/homebridge-web-window)

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based valve to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to open and close the window.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-web-window`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "WebWindow",
       "name": "Window",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `WebWindow` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Root URL of your device | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `autoReset` | Whether obstruction detection should automatically change the state back to `0` after being triggered | `false` |
| `autoResetDelay` | Time (in seconds) until the obstruction detection will automatically reset (if enabled) | `5` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `listener` | Whether to start a listener to get real-time changes from the device | `false` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (if enabled) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## API Interfacing

Your API should be able to:

1. Return JSON information when it receives `/status`:
```
{
    "positionState": INT_VALUE,
    "currentPosition": INT_VALUE,
    "targetPosition": INT_VALUE
}
```

2. Open/close the garage when it receives:
```
/targetPosition/INT_VALUE_0_TO_100
```

3. Update `currentPosition` as it opens/closes by messaging the listen server:
```
/currentPosition/INT_VALUE_0_TO_100
```

4. Update `positionState` as it opens/closes by messaging the listen server:
```
/positionState/INT_VALUE_0_TO_2
```

5. Update `targetPosition` following a manual override by messaging the listen server:
```
/targetPosition/INT_VALUE_0_TO_100
```

6. Update `obstructionDetected` when an obstruction is detected by messaging the listen server (should notify `0` after obstruction moves unless `autoReset` is enabled):
```
/obstructionDetected/INT_VALUE_0_TO_1
```

## PositionState Key

| Number | Name |
| --- | --- |
| `0` | Opening |
| `1` | Closing |
| `2` | Open/Closedd |
