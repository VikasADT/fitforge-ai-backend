export const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'test') console.log(...args);
};
