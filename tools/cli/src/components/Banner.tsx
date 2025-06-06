import { Box, Text } from 'ink';

interface BannerProps {
  shapeName: string;
  endpoint: string;
  appId?: string;
}

export const Banner = ({ shapeName, endpoint, appId }: BannerProps) => {
  const getEndpointInfo = () => {
    const isProduction = endpoint.includes('api.shapes.inc');
    let displayUrl = isProduction ? 'prod' : endpoint.replace(/^https?:\/\//, '');

    // Remove /v1 from non-production endpoints
    if (!isProduction) {
      displayUrl = displayUrl.replace(/\/v1$/, '');
    }

    const color = isProduction ? 'green' : 'yellow';
    return { displayUrl, color };
  };

  const renderShapeName = () => {
    if (shapeName.startsWith('shapesinc/')) {
      const parts = shapeName.split('/');
      return (
        <>
          <Text color="gray">shapesinc/</Text>
          <Text color="cyan">{parts[1]}</Text>
        </>
      );
    }
    return <Text color="cyan">{shapeName}</Text>;
  };

  const endpointInfo = getEndpointInfo();

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Title box */}
      <Box marginBottom={1}>
        <Box borderStyle="round" borderColor="white" paddingX={1} width={60}>
          <Text color="white">● Shapes API Console</Text>
        </Box>
      </Box>

      {/* Info box */}
      <Box>
        <Box borderStyle="round" borderColor="gray" paddingX={1} width={60}>
          <Box flexDirection="column">
            <Text color={endpointInfo.color}>{endpointInfo.displayUrl}</Text>
            <Text>
              <Text color="cyan">↳</Text>
              <Text color="gray"> shape:  </Text>
              {renderShapeName()}
            </Text>
            {appId && (
              <Text>
                <Text color="cyan">↳</Text>
                <Text color="gray"> app id: </Text>
                <Text color="cyan">{appId}</Text>
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};