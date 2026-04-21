import type { Category } from '../types';

export const CATEGORY_SELECTED_COLORS: Record<Category, string> = {
  Work: 'bg-[#E8ECF1] text-text-primary border-[#C5CFDA]',
  Kids: 'bg-[#EAF0EA] text-text-primary border-[#C5D3C5]',
  Family: 'bg-[#F0ECE6] text-text-primary border-[#D9CEBF]',
  Personal: 'bg-[#EEE9F1] text-text-primary border-[#CEC5D8]',
  Social: 'bg-[#E9EEF2] text-text-primary border-[#C2CEDB]',
  Fitness: 'bg-[#E7F0ED] text-text-primary border-[#BED2CB]',
};

export const CATEGORY_CARD_COLORS: Record<Category, string> = {
  Work: 'border-[#C5CFDA] bg-[#F5F7FA]',
  Kids: 'border-[#C5D3C5] bg-[#F5F8F5]',
  Family: 'border-[#D9CEBF] bg-[#FAF7F2]',
  Personal: 'border-[#CEC5D8] bg-[#F8F5FA]',
  Social: 'border-[#C2CEDB] bg-[#F4F7FA]',
  Fitness: 'border-[#BED2CB] bg-[#F3F8F6]',
};

export const CATEGORY_CHIP_COLORS: Record<Category, string> = {
  Work: 'bg-[#E8ECF1] text-text-primary',
  Kids: 'bg-[#EAF0EA] text-text-primary',
  Family: 'bg-[#F0ECE6] text-text-primary',
  Personal: 'bg-[#EEE9F1] text-text-primary',
  Social: 'bg-[#E9EEF2] text-text-primary',
  Fitness: 'bg-[#E7F0ED] text-text-primary',
};
