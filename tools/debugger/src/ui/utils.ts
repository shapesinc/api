/**
 * Get display information for an endpoint URL.
 */
export function getEndpointInfo(forwardingTo: string): { displayUrl: string; color: string } {
  let displayUrl: string;
  let color: string;

  if (forwardingTo.includes('api.shapes.inc')) {
    displayUrl = 'prod';
    color = 'green';
  } else if (forwardingTo.includes('localhost:8080')) {
    displayUrl = 'local';
    color = 'blueBright';
  } else if (forwardingTo.includes('localhost:8090')) {
    displayUrl = 'debugger';
    color = 'yellow';
  } else {
    displayUrl = forwardingTo.replace(/^https?:\/\//, '').replace(/\/v1$/, '');
    color = 'magenta';
  }

  return { displayUrl, color };
}