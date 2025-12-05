export const parallelProcessing = {
  process: async (items: any[], fn: any) => Promise.all(items.map(fn)),
};
export const processWithProgressiveResults = async (items: any[], fn: any) => Promise.all(items.map(fn));
export default parallelProcessing;
