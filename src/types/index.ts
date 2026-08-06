export type Item = { id: string; title: string; meta: string; done?: boolean };
export type DemoData = {
  user: { name: string; joined: string; weight: number };
  priorities: Item[];
  timeline: Item[];
  tasks: Item[];
  notifications: Item[];
  meals: Item[];
  transactions: Item[];
};
