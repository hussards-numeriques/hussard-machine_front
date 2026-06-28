const SHINY_PROBABILITY = 0.001;
const isShinySession = Math.random() < SHINY_PROBABILITY;

export const useShinySession = () => isShinySession;
