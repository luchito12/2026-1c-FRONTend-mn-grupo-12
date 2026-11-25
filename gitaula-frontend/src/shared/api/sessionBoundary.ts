let generation = 0;
let closing = false;
const controllers = new Set<AbortController>();
export const sessionGeneration = () => generation;
export const isClosingSession = () => closing;
export const setClosingSession = (value: boolean) => {
  closing = value;
};
export function advanceSession() {
  generation += 1;
  controllers.forEach((controller) => controller.abort());
  controllers.clear();
  closing = false;
}
export function trackRequest(controller: AbortController) {
  controllers.add(controller);
  return () => controllers.delete(controller);
}
