import net from 'node:net'
import { URL } from 'node:url'

/**
 * Check if a TCP port is accepting connections.
 */
function isTcpPortOpen(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise(resolve => {
        const sock = new net.Socket()
        let settled = false
        const onDone = (up: boolean) => {
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

export type ServiceType = 'api' | 'auth' | 'site' | 'api-server'

interface ServiceConfig {
    prodUrl: string
    devUrl: string
    debugUrl: string
}

const serviceConfigs: Record<ServiceType, ServiceConfig> = {
    'api': {
        prodUrl: 'https://api.shapes.inc/v1',
        devUrl: 'http://localhost:8080/v1',
        debugUrl: 'http://localhost:8090/v1',
    },
    'api-server': {
        prodUrl: 'https://api.shapes.inc/v1',
        devUrl: 'http://localhost:8080/v1',
        debugUrl: 'http://localhost:8080/v1',
    },
    'auth': {
        prodUrl: 'https://api.shapes.inc/auth',
        devUrl: 'http://localhost:8080/auth',
        debugUrl: 'http://localhost:8090/auth',
    },
    'site': {
        prodUrl: 'https://shapes.inc',
        devUrl: 'http://localhost:3000',
        debugUrl: 'http://localhost:3000',
    },
}

/**
 * Discovers available service URL by checking ports in priority order:
 * 1. Debug URL (if available)
 * 2. Dev URL (if available)
 * 3. Production URL (fallback)
 */
export async function discoverServiceUrl(serviceType: ServiceType): Promise<string> {
    const config = serviceConfigs[serviceType]
    if (!config) {
        throw new Error(`Unknown service type: ${serviceType}`)
    }

    try {
        // Check debug URL
        if (config.debugUrl) {
            const debugHost = new URL(config.debugUrl)
            const isDebugUp = await isTcpPortOpen(
                debugHost.hostname, 
                Number(debugHost.port) || (debugHost.protocol === 'https:' ? 443 : 80), 
                200
            )
            if (isDebugUp) return config.debugUrl
        }

        // Check dev URL
        if (config.devUrl) {
            const devHost = new URL(config.devUrl)
            const isDevUp = await isTcpPortOpen(
                devHost.hostname, 
                Number(devHost.port) || (devHost.protocol === 'https:' ? 443 : 80), 
                200
            )
            if (isDevUp) return config.devUrl
        }

        // Fallback to production
        return config.prodUrl
    } catch {
        return config.prodUrl
    }
}

// Legacy compatibility functions
export async function getApiServerBaseUrl(): Promise<string> {
    return discoverServiceUrl('api-server')
}

export async function getApiBaseUrl(): Promise<string> {
    return discoverServiceUrl('api')
}

export async function getAuthBaseUrl(): Promise<string> {
    return discoverServiceUrl('auth')
}

export async function getSiteBaseUrl(): Promise<string> {
    return discoverServiceUrl('site')
}