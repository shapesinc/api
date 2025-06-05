import net from 'node:net'
import { URL } from 'node:url'

/**
 * Check if a TCP port is accepting connections.
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
function isTcpPortOpen(host, port, timeoutMs) {
    return new Promise(resolve => {
        const sock = new net.Socket()
        let settled = false
        const onDone = up => {
            if (!settled) {
                settled = true
                sock.destroy()
                resolve(up)
            }
        }
        sock.setTimeout(timeoutMs)
        sock.once('connect', () => onDone(true))
        sock.once('timeout', () => onDone(false))
        sock.once('error', () => onDone(false))
        sock.connect(port, host)
    })
}

/**
 * @param {object} [opts]
 * @param {string} [opts.prodUrl]
 * @param {string} [opts.devUrl]
 * @param {string} [opts.debugUrl]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<string>}
 */
async function getBaseUrl({
    prodUrl,
    devUrl,
    debugUrl,
} = {}) {
    try {
        const debugHost = new URL(debugUrl)
        const isDebugUp = await isTcpPortOpen(debugHost.hostname, Number(debugHost.port) || (debugHost.protocol === 'https:' ? 443 : 80), 200)
        const devHost = new URL(devUrl)
        const isDevUp = await isTcpPortOpen(devHost.hostname, Number(devHost.port) || (devHost.protocol === 'https:' ? 443 : 80), 200)
        return isDebugUp ? debugUrl : isDevUp ? devUrl : prodUrl
    } catch (err) {
        return prodUrl;
    }
}

/*
Autodiscover the API server base URL
Will discover both local server if available
*/
export async function getApiServerBaseUrl() {
    return await getBaseUrl({
        prodUrl: 'https://api.shapes.inc/v1',
        devUrl: 'http://localhost:8080/v1',
        debugUrl: 'http://localhost:8080/v1',
    })
}

/*
Autodiscover the API base URL
Will discover both local server and a debug proxy if available
*/
export async function getApiBaseUrl() {
    return await getBaseUrl({
        prodUrl: 'https://api.shapes.inc/v1',
        devUrl: 'http://localhost:8080/v1',
        debugUrl: 'http://localhost:8090/v1',
    })
}

/*
Autodiscover the Auth base URL
Will discover both local server and a debug proxy if available
*/
export async function getAuthBaseUrl() {
    return await getBaseUrl({
        prodUrl: 'https://api.shapes.inc/auth',
        devUrl: 'http://localhost:8080/auth',
        debugUrl: 'http://localhost:8090/auth',
    })
}

/*
Autodiscover the Site base URL
Will discover both local server and a debug proxy if available
*/
export async function getSiteBaseUrl() {
    return await getBaseUrl({
        prodUrl: 'https://shapes.inc',
        devUrl: 'http://localhost:3000',
        debugUrl: 'http://localhost:3000',
    })
}
