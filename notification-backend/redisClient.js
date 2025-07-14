import { createClient } from 'redis';

export const redisSub = createClient({ url: 'redis://localhost:6379' });
await redisSub.connect();
