import { createClient } from 'redis';

export const redis = createClient({ url: 'redis://localhost:6379' });
export const redisPub = redis.duplicate(); // publisher

await Promise.all([
  redis.connect(),
  redisPub.connect(),
]);

redis.on('error', err => console.error('Redis Error:', err));
