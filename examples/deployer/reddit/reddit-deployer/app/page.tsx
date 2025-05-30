'use client';

import { useState, FormEvent } from 'react';

export default function RedditShapeBotPage() {
  const [formData, setFormData] = useState({
    redditClientId: '',
    redditClientSecret: '',
    redditUsername: '',
    redditPassword: '',
    redditSubreddit: '',
    shapesApiKey: '',
    shapesUsername: '',
    pollingIntervalMs: '5000',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
          pollingIntervalMs: parseInt(formData.pollingIntervalMs, 10) || 5000,
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

  const inputFields = [
    // Reddit section
    { id: 'redditClientId', label: 'Reddit Client ID', type: 'text', required: true, section: 'reddit' },
    { id: 'redditClientSecret', label: 'Reddit Client Secret', type: 'text', required: true, section: 'reddit' },
    { id: 'redditUsername', label: 'Reddit Username', type: 'text', required: true, section: 'reddit' },
    { id: 'redditPassword', label: 'Reddit Password', type: 'password', required: true, section: 'reddit',
      hint: 'It\'s recommended to use a Reddit App Password for security.' },
    { id: 'redditSubreddit', label: 'Subreddit to monitor', type: 'text', required: true, section: 'reddit',
      hint: 'Example: \'test\' (without r/)' },
    
    // Shapes section
    { id: 'shapesApiKey', label: 'Shapes.inc API Key', type: 'text', required: true, section: 'shapes' },
    { id: 'shapesUsername', label: 'Shapes.inc Username', type: 'text', required: true, section: 'shapes' },
    
    // Config section
    { id: 'pollingIntervalMs', label: 'Polling Interval (ms)', type: 'number', required: false, section: 'config',
      hint: 'How often to check for new comments (default: 5000ms = 5 seconds).' },
  ];

  return (
    <div className="max-w-xl mx-auto my-4 p-5 bg-white rounded-lg shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Deploy Reddit Shape Bot 🤖
      </h1>
      <p className="text-center text-gray-600 text-sm mb-4">
        Deploy your bot to interact between Reddit and Shapes.inc
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reddit Credentials Section */}
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Reddit Credentials</h2>
          <div className="grid grid-cols-1 gap-3">
            {inputFields
              .filter(field => field.section === 'reddit')
              .map(field => (
                <div key={field.id}>
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
        </div>

        {/* Shapes.inc Credentials Section */}
        <div className="border-b border-gray-200 pb-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Shapes.inc Credentials</h2>
          <div className="grid grid-cols-1 gap-3">
            {inputFields
              .filter(field => field.section === 'shapes')
              .map(field => (
                <div key={field.id}>
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
        </div>

        {/* Bot Configuration Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Bot Configuration</h2>
          <div className="grid grid-cols-1 gap-3">
            {inputFields
              .filter(field => field.section === 'config')
              .map(field => (
                <div key={field.id}>
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
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`py-2 px-4 rounded-md font-medium text-white transition ${
              isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Deploying...' : 'Deploy Bot'}
          </button>
          
          <button
            type="button"
            onClick={handleStop}
            disabled={isLoading}
            className={`py-2 px-4 rounded-md font-medium text-white transition ${
              isLoading ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Stopping...' : 'Stop Bot'}
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
      
      {/* Deployment Info Toggle */}
      <div className="mt-4 pt-2 border-t border-gray-200">
      </div>
    </div>
  );
}