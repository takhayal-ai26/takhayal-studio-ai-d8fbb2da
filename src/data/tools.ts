import generateImg from '@/assets/tools/generate.jpg';
import upscaleImg from '@/assets/tools/upscale.jpg';
import logoImg from '@/assets/tools/logo.jpg';
import removeBgImg from '@/assets/tools/remove-bg.jpg';
import enhanceImg from '@/assets/tools/enhance.jpg';
import { Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, type LucideIcon } from 'lucide-react';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  shortDesc: string;
  image: string;
  route: string;
  icon: LucideIcon;
  inputType: 'prompt' | 'upload';
  heroTagline: string;
  creditCost: number;
  options: ToolOption[];
  examples: ToolExample[];
}

export interface ToolOption {
  label: string;
  values: string[];
  defaultValue: string;
}

export interface ToolExample {
  image: string;
  prompt: string;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'generate',
    name: 'Generate Image',
    description: 'Create stunning visuals from text descriptions using state-of-the-art AI models.',
    shortDesc: 'Create visuals from text',
    image: generateImg,
    route: '/tools/generate',
    icon: Sparkles,
    inputType: 'prompt',
    heroTagline: 'Turn your ideas into stunning visuals',
    creditCost: 2,
    options: [
      { label: 'Style', values: ['Cinematic', 'Photorealistic', 'Illustration', '3D Render', 'Minimal'], defaultValue: 'Cinematic' },
      { label: 'Format', values: ['Square', 'Portrait', 'Landscape', 'Story'], defaultValue: 'Square' },
      { label: 'Ratio', values: ['1:1', '9:16', '16:9', '4:5'], defaultValue: '1:1' },
    ],
    examples: [
      { image: 'https://picsum.photos/seed/gen-ex1/400/400', prompt: 'Luxury perfume bottle, dramatic studio lighting, dark background' },
      { image: 'https://picsum.photos/seed/gen-ex2/400/400', prompt: 'Cinematic Ramadan ad, golden lanterns, warm glow' },
      { image: 'https://picsum.photos/seed/gen-ex3/400/400', prompt: 'High-end fashion editorial, soft diffused light' },
      { image: 'https://picsum.photos/seed/gen-ex4/400/400', prompt: 'Modern restaurant, appetizing food shot, warm colors' },
      { image: 'https://picsum.photos/seed/gen-ex5/400/400', prompt: 'Tech product floating on gradient, 3D render' },
      { image: 'https://picsum.photos/seed/gen-ex6/400/400', prompt: 'Real estate exterior, blue sky, architectural photography' },
    ],
  },
  {
    id: 'upscale',
    name: 'Upscale Image',
    description: 'Increase your image resolution up to 4x while preserving every detail.',
    shortDesc: 'Increase resolution instantly',
    image: upscaleImg,
    route: '/tools/upscale',
    icon: ArrowUpCircle,
    inputType: 'upload',
    heroTagline: 'Make every pixel perfect',
    creditCost: 3,
    options: [
      { label: 'Scale', values: ['2x', '4x'], defaultValue: '2x' },
    ],
    examples: [
      { image: 'https://picsum.photos/seed/up-ex1/400/400', prompt: 'Low-res portrait enhanced to 4K' },
      { image: 'https://picsum.photos/seed/up-ex2/400/400', prompt: 'Product photo upscaled with sharp details' },
      { image: 'https://picsum.photos/seed/up-ex3/400/400', prompt: 'Landscape photo enhanced to ultra HD' },
    ],
  },
  {
    id: 'logo',
    name: 'Create Logo',
    description: 'Design modern, clean logos powered by AI in seconds.',
    shortDesc: 'Design modern, clean logos',
    image: logoImg,
    route: '/tools/logo',
    icon: Hexagon,
    inputType: 'prompt',
    heroTagline: 'Your brand identity, instantly',
    creditCost: 3,
    options: [
      { label: 'Style', values: ['Minimal', 'Modern', 'Arabic', 'Geometric', 'Playful'], defaultValue: 'Minimal' },
      { label: 'Type', values: ['Icon', 'Wordmark', 'Combination'], defaultValue: 'Icon' },
    ],
    examples: [
      { image: 'https://picsum.photos/seed/logo-ex1/400/400', prompt: 'Minimal tech startup logo, geometric shapes' },
      { image: 'https://picsum.photos/seed/logo-ex2/400/400', prompt: 'Arabic calligraphy logo, modern twist' },
      { image: 'https://picsum.photos/seed/logo-ex3/400/400', prompt: 'Restaurant brand logo, elegant and warm' },
      { image: 'https://picsum.photos/seed/logo-ex4/400/400', prompt: 'Fashion brand wordmark, clean serif typography' },
    ],
  },
  {
    id: 'remove-bg',
    name: 'Remove Background',
    description: 'Remove image backgrounds instantly with one click.',
    shortDesc: 'Remove background in one click',
    image: removeBgImg,
    route: '/tools/remove-bg',
    icon: Scissors,
    inputType: 'upload',
    heroTagline: 'Clean cutouts in seconds',
    creditCost: 1,
    options: [
      { label: 'Output', values: ['Transparent', 'White', 'Custom Color'], defaultValue: 'Transparent' },
    ],
    examples: [
      { image: 'https://picsum.photos/seed/bg-ex1/400/400', prompt: 'Product on transparent background' },
      { image: 'https://picsum.photos/seed/bg-ex2/400/400', prompt: 'Portrait with background removed' },
      { image: 'https://picsum.photos/seed/bg-ex3/400/400', prompt: 'Object isolated on white background' },
    ],
  },
  {
    id: 'enhance',
    name: 'Enhance Image',
    description: 'Improve quality, sharpen details, and fix colors automatically.',
    shortDesc: 'Improve quality and details',
    image: enhanceImg,
    route: '/tools/enhance',
    icon: Wand2,
    inputType: 'upload',
    heroTagline: 'Enhance your images instantly',
    creditCost: 2,
    options: [
      { label: 'Mode', values: ['General', 'Portrait', 'Landscape', 'Product'], defaultValue: 'General' },
    ],
    examples: [
      { image: 'https://picsum.photos/seed/enh-ex1/400/400', prompt: 'Blurry photo enhanced to sharp HD' },
      { image: 'https://picsum.photos/seed/enh-ex2/400/400', prompt: 'Dark photo with improved brightness and color' },
      { image: 'https://picsum.photos/seed/enh-ex3/400/400', prompt: 'Old photo restored with enhanced details' },
    ],
  },
];
