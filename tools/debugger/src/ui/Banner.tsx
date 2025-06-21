import { Box, Text } from 'ink';

interface BannerProps {
  proxyPort: number;
  forwardingTo: string;
  requestCount: number;
}

export const Banner = ({ proxyPort, forwardingTo, requestCount }: BannerProps) => {
  const getEndpointInfo = () => {
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
  };

  const endpointInfo = getEndpointInfo();

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Title box */}
      <Box marginBottom={1}>
        <Box borderStyle="round" borderColor="white" paddingX={1} width={60}>
          <Text color="white">● Shapes API Debugger</Text>
        </Box>
      </Box>

      {/* Info box */}
      <Box>
        <Box borderStyle="round" borderColor="gray" paddingX={1} width={60}>
          <Box flexDirection="column">
            <Text color={endpointInfo.color}>{endpointInfo.displayUrl}</Text>
            <Text>
              <Text color="cyan">↳</Text>
              <Text color="gray"> proxy:    </Text>
              <Text color="yellow">localhost:{proxyPort}</Text>
            </Text>
            <Text>
              <Text color="cyan">↳</Text>
              <Text color="gray"> forward:  </Text>
              <Text color={endpointInfo.color}>{forwardingTo}</Text>
            </Text>
            <Text>
              <Text color="cyan">↳</Text>
              <Text color="gray"> requests: </Text>
              <Text color="cyan">{requestCount}</Text>
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};