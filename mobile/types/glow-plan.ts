export type CategoryType = 'All' | 'Jawline' | 'Skin' | 'Style' | 'Fitness' | 'Grooming' | 'Skincare' | 'Nutrition' | 'Lifestyle';
export type DifficultyType = 'easy' | 'medium' | 'hard';

export interface Recommendation {
  id: string;
  category: CategoryType;
  title: string;
  description: string;
  difficulty: DifficultyType;
  timeframeWeeks: number;
  priority: boolean;
  completed: boolean;
}

export interface ProgressStats {
  completed: number;
  total: number;
}
