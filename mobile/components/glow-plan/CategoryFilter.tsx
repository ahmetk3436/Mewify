import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
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
      contentContainerStyle={{ gap: 8, paddingRight: 20 }}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          onPress={() => {
            hapticSelection();
            onSelectCategory(category);
          }}
          className={`px-4 py-2 rounded-full ${
            selectedCategory === category ? 'bg-blue-600' : 'bg-gray-100'
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-medium ${
              selectedCategory === category ? 'text-white' : 'text-gray-700'
            }`}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default CategoryFilter;
