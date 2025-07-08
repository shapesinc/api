import socket
from urllib.parse import urlparse
from typing import Optional


def is_tcp_port_open(host: str, port: int, timeout_ms: int = 200) -> bool:
    """
    Check if a TCP port is accepting connections.
    
    Args:
        host: The hostname to check
        port: The port number to check
        timeout_ms: Timeout in milliseconds
        
    Returns:
        True if port is open, False otherwise
    """
    timeout_s = timeout_ms / 1000.0
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout_s)
    
    try:
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except (socket.gaierror, socket.timeout):
        sock.close()
        return False


async def get_base_url(
    prod_url: Optional[str] = None,
    dev_url: Optional[str] = None,
    debug_url: Optional[str] = None,
    timeout_ms: int = 200
) -> str:
    """
    Autodiscover the best available base URL by checking ports.
    
    Args:
        prod_url: Production URL (fallback)
        dev_url: Development server URL
        debug_url: Debug proxy URL
        timeout_ms: Timeout for port checks in milliseconds
        
    Returns:
        The best available URL (debug > dev > prod)
    """
    try:
        # Check debug URL first
        if debug_url:
            debug_parsed = urlparse(debug_url)
            debug_port = debug_parsed.port or (443 if debug_parsed.scheme == 'https' else 80)
            if is_tcp_port_open(debug_parsed.hostname, debug_port, timeout_ms):
                return debug_url
        
        # Check dev URL second
        if dev_url:
            dev_parsed = urlparse(dev_url)
            dev_port = dev_parsed.port or (443 if dev_parsed.scheme == 'https' else 80)
            if is_tcp_port_open(dev_parsed.hostname, dev_port, timeout_ms):
                return dev_url
        
        # Fall back to prod URL
        return prod_url or ""
        
    except Exception:
        return prod_url or ""


async def get_api_server_base_url() -> str:
    """
    Autodiscover the API server base URL.
    Will discover local server if available.
    """
    return await get_base_url(
        prod_url='https://api.shapes.inc/v1',
        dev_url='http://localhost:8080/v1',
        debug_url='http://localhost:8080/v1',
    )


async def get_api_base_url() -> str:
    """
    Autodiscover the API base URL.
    Will discover both local server and a debug proxy if available.
    """
    return await get_base_url(
        prod_url='https://api.shapes.inc/v1',
        dev_url='http://localhost:8080/v1',
        debug_url='http://localhost:8090/v1',
    )


async def get_auth_base_url() -> str:
    """
    Autodiscover the Auth base URL.
    Will discover both local server and a debug proxy if available.
    """
    return await get_base_url(
        prod_url='https://api.shapes.inc/auth',
        dev_url='http://localhost:8080/auth',
        debug_url='http://localhost:8090/auth',
    )


async def get_site_base_url() -> str:
    """
    Autodiscover the Site base URL.
    Will discover both local server and a debug proxy if available.
    """
    return await get_base_url(
        prod_url='https://shapes.inc',
        dev_url='http://localhost:3000',
        debug_url='http://localhost:3000',
    )