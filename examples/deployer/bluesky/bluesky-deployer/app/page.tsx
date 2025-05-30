'use client';

import { useState, FormEvent } from 'react';

const colors = {
  primary: '#007bff',
  accent: '#1abc9c',
  danger: '#dc3545',
  success: '#28a745',
  dark: '#333',
  light: '#f4f4f4',
  white: '#fff',
};

export default function HomePage() {
  const [formData, setFormData] = useState({
    blueskyIdentifier: '',
    blueskyPassword: '',
    shapesApiKey: '',
    shapesUsername: '',
    pollingInterval: '60000',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Deploying...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pollingInterval: parseInt(formData.pollingInterval, 10) || 60000,
        }),
      });

      const data = await response.json();
      setStatus(response.ok 
        ? `✅ Deployment successful! ${data.message}` 
        : `❌ Failed: ${data.error || 'Unknown error'}`);
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message || 'An error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setStatus('Stopping...');
    setIsLoading(true);
    try {
      const response = await fetch('/api/stop', { method: 'POST' });
      const data = await response.json();
      setStatus(response.ok 
        ? `✅ Stop successful: ${data.message}` 
        : `❌ Stop failed: ${data.error || 'Unknown error'}`);
    } catch (error: any) {
      setStatus(`❌ Stop failed: ${error.message || 'An error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h1 className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
        Deploy Bluesky Shape Bot 🤖
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-3">
          {[
            { id: 'blueskyIdentifier', label: 'Bluesky Handle/Email', type: 'text', required: true },
            { id: 'blueskyPassword', label: 'App Password', type: 'password', required: true, 
              hint: 'Use an App Password for security' },
            { id: 'shapesApiKey', label: 'Shapes.inc API Key', type: 'text', required: true },
            { id: 'shapesUsername', label: 'Shapes Username', type: 'text', required: true },
            { id: 'pollingInterval', label: 'Polling Interval (ms)', type: 'number', 
              hint: 'Default: 60000ms (1 min)' },
          ].map(field => (
            <div key={field.id} className="mb-1">
              <label htmlFor={field.id} className="block text-sm font-medium mb-1 text-gray-700">
                {field.label}:
              </label>
              <input
                id={field.id}
                type={field.type}
                value={formData[field.id as keyof typeof formData]}
                onChange={handleChange}
                required={field.required}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-50"
              />
              {field.hint && <p className="text-xs text-gray-500 mt-1">{field.hint}</p>}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md font-medium text-white transition ${
              isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-teal-500 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Deploying... ✨' : 'Deploy Bot Now!'}
          </button>
          
          <button
            type="button"
            onClick={handleStop}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md font-medium text-white transition ${
              isLoading ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Stopping...' : 'Stop/Disable Bot'}
          </button>
        </div>
      </form>

      {status && (
        <div className={`mt-4 p-2 text-center rounded-md text-sm font-medium ${
          status.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 
          status.includes('❌') ? 'bg-red-100 text-red-700 border border-red-300' : 
          'bg-gray-100 text-gray-700 border border-gray-300'
        }`}>
          {status}
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Note: Your Bluesky App Password is masked for security.
      </p>
    </div>
  );
}