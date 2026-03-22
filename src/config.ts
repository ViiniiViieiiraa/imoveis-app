export const config = {
    port: Number(process.env.PORT) || 3000,
    host: '127.0.0.1',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',
  } as const