import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { CategoryType } from '../../types/glow-plan';
import { hapticSelection } from '../../lib/haptics';

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const categories: CategoryType[] = ['All', 'Jawline', 'Skin', 'Style', 'Fitness', 'Grooming'];

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4 pl-5"
      contentContainerStyle={{ gap: 10, paddingRight: 20 }}
    >
      {categories.map((category) => {
        const selected = selectedCategory === category;
        return (
          <TouchableOpacity
            key={category}
            onPress={() => {
              hapticSelection();
              onSelectCategory(category);
            }}
            className={`rounded-full border px-4 py-2 ${
              selected
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/10 bg-white/5'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                selected ? 'text-blue-200' : 'text-gray-300'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default CategoryFilter;
