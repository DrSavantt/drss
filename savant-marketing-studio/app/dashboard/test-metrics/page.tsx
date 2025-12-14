import { 
  getClientHealthMetric,
  getProjectVelocityMetric,
  getContentOutputMetric,
  getStorageMetric,
  getCapacityMetric
} from '@/lib/dashboard/metrics';

export default async function TestMetrics() {
  const clientHealth = await getClientHealthMetric();
  const projectVelocity = await getProjectVelocityMetric();
  const contentOutput = await getContentOutputMetric();
  const storage = await getStorageMetric();
  const capacity = await getCapacityMetric();
  
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Metric Test</h1>
      
      <pre className="bg-black p-4 rounded text-xs text-green-400">
        {JSON.stringify({ clientHealth, projectVelocity, contentOutput, storage, capacity }, null, 2)}
      </pre>
    </div>
  );
}
