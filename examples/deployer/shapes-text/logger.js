// logger.js
// Basic console logger to mimic Python logging format
const logLevels = {
    INFO: 2,
    WARNING: 3,
    ERROR: 4,
};

const currentLogLevel = process.env.LOG_LEVEL ? logLevels[process.env.LOG_LEVEL.toUpperCase()] : logLevels.INFO;

function formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    // Simple format: timestamp - levelname - message
    return `${timestamp} - ${level} - ${message}`;
}

module.exports = {
    info: (message) => {
        if (currentLogLevel <= logLevels.INFO) console.info(formatMessage('INFO', message));
    },
    warning: (message) => {
        if (currentLogLevel <= logLevels.WARNING) console.warn(formatMessage('WARNING', message));
    },
    error: (message) => {
        if (currentLogLevel <= logLevels.ERROR) console.error(formatMessage('ERROR', message));
    },
    // Add other levels like debug if needed
};