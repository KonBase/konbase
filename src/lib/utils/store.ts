import { create } from 'zustand';

type Assoc = { id: string; name: string };

type State = {
  currentAssociation?: Assoc;
  setAssociation: (a?: Assoc) => void;
  search: string;
  setSearch: (q: string) => void;
};

export const useAppStore = create<State>(set => ({
  currentAssociation: undefined,
  setAssociation: a => set({ currentAssociation: a }),
  search: '',
  setSearch: q => set({ search: q }),
}));
