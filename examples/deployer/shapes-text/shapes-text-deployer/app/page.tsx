// app/page.tsx - UPDATED

'use client';

import { useState } from 'react';

export default function HomePage() {
  const [formData, setFormData] = useState({
    // Keys explicitly requested by the user for the frontend form
    SHAPES_API_KEY: '',
    DEFAULT_SHAPE_USER: '',
    TEST_USER_ID: '', // Note: TEST_USER_ID and USER_PHONE_NUMBER might not be needed in the final deployed config
    TWILIO_ACCOUNT_SID: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_PHONE_NUMBER: '',
    USER_PHONE_NUMBER: '', // Note: TEST_USER_ID and USER_PHONE_NUMBER might not be needed in the final deployed config
  });

  const [status, setStatus] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isStopping, setIsStopping] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setStatus('Deploying...');
    setPublicUrl(''); // Clear previous URL

    try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData), // Send only the limited formData
        });

        const data = await res.json();
        if (res.ok) {
          setPublicUrl(data.publicUrl || ''); // publicUrl might be undefined if service info isn't ready
          setStatus(data.message || 'Deployment successful!');
        } else {
          setStatus('Deployment failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error: any) {
         setStatus('Deployment failed: ' + (error.message || 'Network error'));
    } finally {
        setIsDeploying(false);
    }
  };

   const handleStop = async () => {
    setIsStopping(true);
    setStatus('Stopping deployment...');
    setPublicUrl(''); // Clear URL when stopping

    try {
        const res = await fetch('/api/stop', {
          method: 'POST',
           // No body needed for stop
        });

        const data = await res.json();
        if (res.ok) {
          setStatus(data.message || 'Deployment stopped successfully!');
        } else {
          setStatus('Stop failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error: any) {
        setStatus('Stop failed: ' + (error.message || 'Network error'));
    } finally {
        setIsStopping(false);
    }
   };


  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Manage Shape Bot Deployment</h1>

      {/* User-provided configuration */}
      <h2 className="text-lg font-semibold mt-6">User Configuration</h2>
      {Object.entries(formData).map(([key, value]) => (
        <div key={key}>
          <label className="block text-sm font-semibold">{key.replace(/_/g, ' ')}</label>
          <input
            name={key}
            value={value}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
            type={key.includes('KEY') || key.includes('TOKEN') ? 'password' : 'text'}
          />
        </div>
      ))}


      <div className="flex space-x-4">
          <button
            onClick={handleDeploy}
            className={`bg-blue-600 text-white px-4 py-2 rounded ${isDeploying ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDeploying || isStopping}
          >
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
           <button
            onClick={handleStop}
            className={`bg-red-600 text-white px-4 py-2 rounded ${isStopping ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDeploying || isStopping}
          >
            {isStopping ? 'Stopping...' : 'Stop Deployment'}
          </button>
      </div>

      <div className="mt-4">{status}</div>
      {publicUrl && (
        <div className="mt-2">
          Public URL: <code>{publicUrl}</code> (Access via <code>minikube tunnel</code> or NodePort)
        </div>
      )}
    </div>
  );
}