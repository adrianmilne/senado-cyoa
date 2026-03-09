export type EffectType =
  | 'set_flag'
  | 'modify_stat'
  | 'set_stat'
  | 'add_item'
  | 'remove_item';

export interface Effect {
  type: EffectType;
  key: string;
  value?: unknown;
  displayName?: string;
}
