// payload que o front espera tocar
export type RoundPayload = {
  events: any[];   // depois você refina para BookEvent[]
  id?: string;     // opcional (debug pode ter um id fake)
};
