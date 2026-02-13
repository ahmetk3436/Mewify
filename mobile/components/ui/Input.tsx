import React, { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  dark?: boolean;
}

export default function Input({ label, error, dark = false, className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const labelColor = dark ? 'text-gray-300' : 'text-gray-700';
  const baseInput = dark
    ? 'w-full rounded-xl border bg-slate-900/80 px-4 py-3 text-base text-white'
    : 'w-full rounded-xl border bg-white px-4 py-3 text-base text-gray-900';
  const focusInput = dark
    ? 'border-blue-400'
    : 'border-primary-500 ring-2 ring-primary-200';
  const idleInput = dark ? 'border-slate-700' : 'border-gray-300';

  return (
    <View className="w-full">
      {label && (
        <Text className={`mb-1.5 text-sm font-medium ${labelColor}`}>
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          baseInput,
          isFocused ? focusInput : idleInput,
          error && 'border-red-500',
          className
        )}
        placeholderTextColor={dark ? '#64748b' : '#9ca3af'}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm text-red-500">{error}</Text>
      )}
    </View>
  );
}
