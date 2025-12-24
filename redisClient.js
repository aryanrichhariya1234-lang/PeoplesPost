import Redis from 'ioredis';

const redis = new Redis(
  'rediss://default:AYFHAAIncDFkNmY0ZTNlMGE1YzU0MDhiYjFkMmUyYmVjODk3NzAxZHAxMzMwOTU@game-tiger-33095.upstash.io:6379',
  {
    tls: {}, // REQUIRED for rediss
    maxRetriesPerRequest: 3,
  }
);

redis.on('connect', () => {
  console.log('Redis connected (Upstash)');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;
