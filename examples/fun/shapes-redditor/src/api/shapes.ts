export async function getAIResponse(message: string, reset: boolean = false) {
  const response = await fetch('/api/shapes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, reset }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await response.json();
  return data.content;
} 