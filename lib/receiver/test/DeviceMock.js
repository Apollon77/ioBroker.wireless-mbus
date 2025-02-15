'use strict';

const { SerialPortStream } = require('@serialport/stream');
const fs = require('fs');

const { EventHelper, MockBinding } = require('./MockBindingHelper');

class DeviceMock extends SerialPortStream {
    constructor(options) {
        MockBinding.createPort(options.path, { echo: false, record: false, readyData: Buffer.alloc(0) });
        const opts = {
            binding: MockBinding,
            ...options
        };
        super(opts);

        EventHelper.emitter.on('write', this.onWrite.bind(this));
        this.communicationLog = [];
    }

    setDeviceProperties(filename) {
        if (fs.existsSync(filename)) {
            const options = JSON.parse(fs.readFileSync(filename, { encoding: 'utf-8' }));
            Object.keys(options).forEach(key => this[key] = options[key]);
        }
    }

    /* eslint-disable no-unused-vars */

    getResponse(request) {
        throw new Error('getResponse is unimplemented');
    }

    sendTelegram(dataString, rssi, frameType, ts, withCrc) {
        throw new Error('sendTelegram is unimplemented!');
    }

    /* eslint-enable no-unused-vars */

    onWrite(buffer) {
        this.communicationLog.push(`<<< ${buffer.toString('hex')}`);

        const response = this.getResponse(buffer);
        if (Buffer.isBuffer(response)) {
            this.sendData(response);
        }
    }

    sendData(data) {
        console.log(`>>> ${data.toString('hex')}`);
        this.communicationLog.push(`>>> ${data.toString('hex')}`);
        this.port.emitData(data);
    }

    close() {
        super.close();
        MockBinding.reset();
    }
}

module.exports = DeviceMock;
