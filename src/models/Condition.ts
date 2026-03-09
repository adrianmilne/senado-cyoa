export type ConditionType =
  | 'flag_is_true'
  | 'flag_is_false'
  | 'has_item'
  | 'not_has_item'
  | 'stat_greater_than'
  | 'stat_less_than'
  | 'scene_visited'
  | 'scene_not_visited';

export interface Condition {
  type: ConditionType;
  key: string;
  value?: unknown;
}
