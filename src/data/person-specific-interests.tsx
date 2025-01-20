import { Interest } from '@/types/interests';

export const getPersonSpecificInterests = (person: string): Interest[] => {
  switch (person.toLowerCase()) {
    case 'wife':
      return [
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Reading', icon: '📚' },
        { label: 'Beauty Products', icon: '💄' },
        { label: 'Fashion', icon: '👗' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Home Décor', icon: '🏠' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Knitting', icon: '🧶' },
        { label: 'Fitness', icon: '🏃‍♀️' },
        { label: 'Dancing', icon: '💃' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Wine', icon: '🍷' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Photography', icon: '📸' },
        { label: 'Jewelry', icon: '💍' },
        { label: 'Music', icon: '🎵' },
        { label: 'Writing', icon: '✍️' },
        { label: 'Painting', icon: '🖌️' }
      ];
    case 'husband':
      return [
        { label: 'Video Games', icon: '🎮' },
        { label: 'Gadgets', icon: '🔧' },
        { label: 'Grilling & BBQ', icon: '🍖' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Football', icon: '🏈' },
        { label: 'Motorcycles', icon: '🏍️' },
        { label: 'Reading', icon: '📚' },
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'DIY', icon: '🔨' },
        { label: 'Tools', icon: '🛠️' },
        { label: 'Fishing & Hunting', icon: '🎣' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Music', icon: '🎵' },
        { label: 'Movies', icon: '🎬' },
        { label: 'TV', icon: '📺' },
        { label: 'Beer', icon: '🍺' },
        { label: 'Whiskey', icon: '🥃' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Baseball', icon: '⚾' },
        { label: 'Tech', icon: '💻' },
        { label: 'Cooking', icon: '👨‍🍳' }
      ];
    case 'father':
      return [
        { label: 'Video Games', icon: '🎮' },
        { label: 'Gadgets', icon: '🔧' },
        { label: 'Grilling & BBQ', icon: '🍖' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Football', icon: '🏈' },
        { label: 'Motorcycles', icon: '🏍️' },
        { label: 'Reading', icon: '📚' },
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'DIY', icon: '🔨' },
        { label: 'Tools', icon: '🛠️' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Hunting', icon: '🎯' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Music', icon: '🎵' },
        { label: 'Movies & TV', icon: '🎬' },
        { label: 'Beer', icon: '🍺' },
        { label: 'Whiskey', icon: '🥃' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Baseball', icon: '⚾' },
        { label: 'Tech', icon: '💻' },
        { label: 'Cooking', icon: '👨‍🍳' }
      ];
    case 'mother':
      return [
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Reading', icon: '📚' },
        { label: 'Beauty Products', icon: '💄' },
        { label: 'Fashion', icon: '👗' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Home Decor', icon: '🏠' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Knitting', icon: '🧶' },
        { label: 'Fitness', icon: '🏃‍♀️' },
        { label: 'Interior Design', icon: '🛋️' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Wine', icon: '🍷' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Photography', icon: '📸' },
        { label: 'Jewelry', icon: '💍' },
        { label: 'Music', icon: '🎵' },
        { label: 'Writing', icon: '✍️' },
        { label: 'Painting', icon: '🖌️' }
      ];
    case 'brother':
      return [
        { label: 'Gaming', icon: '🎮' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Technology', icon: '💻' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Movies', icon: '🎬' },
        { label: 'TV', icon: '📺' },
        { label: 'Music', icon: '🎵' },
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Football', icon: '🏈' },
        { label: 'Drone Tech', icon: '🚁' },
        { label: 'Photography', icon: '📸' },
        { label: 'Reading', icon: '📚' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Computers', icon: '🖥️' },
        { label: 'Fun Gadgets', icon: '🎮' },
        { label: 'Basketball', icon: '🏀' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Hunting', icon: '🎯' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Fashion', icon: '👕' }
      ];
    case 'sister':
      return [
        { label: 'Fashion', icon: '👗' },
        { label: 'Makeup', icon: '💄' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Skincare', icon: '🧴' },
        { label: 'Reading', icon: '📚' },
        { label: 'Making Videos', icon: '📹' },
        { label: 'Jewelry', icon: '💍' },
        { label: 'Movies', icon: '🎬' },
        { label: 'TV', icon: '📺' },
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Dancing', icon: '💃' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Hair Styling', icon: '💇‍♀️' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Photography', icon: '📸' },
        { label: 'Music', icon: '🎵' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Nail Art', icon: '💅' },
        { label: 'Phone Accessories', icon: '📱' },
        { label: 'Room Decor', icon: '🛋️' },
        { label: 'Fitness', icon: '🏃‍♀️' },
        { label: 'Video Games', icon: '🎮' }
      ];
    case 'grandma':
      return [
        { label: 'Knitting', icon: '🧶' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Sewing', icon: '🧵' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Puzzle Books', icon: '📚' },
        { label: 'Jigsaw Puzzles', icon: '🧩' },
        { label: 'Reading', icon: '📖' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Bird Watching', icon: '🦜' },
        { label: 'Photo Albums', icon: '📸' },
        { label: 'Writing', icon: '✍️' },
        { label: 'Music', icon: '🎵' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Collecting', icon: '🏺' },
        { label: 'Cats', icon: '🐱' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Candles', icon: '🕯️' },
        { label: 'Soap', icon: '🧼' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Embroidery', icon: '🪡' },
        { label: 'Tech Gadgets', icon: '📱' },
        { label: 'Travel', icon: '✈️' }
      ];
    case 'grandpa':
      return [
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'Gardening', icon: '🌱' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Fishing', icon: '🎣' },
        { label: 'Hunting', icon: '🎯' },
        { label: 'Dogs', icon: '🐕' },
        { label: 'Reading', icon: '📚' },
        { label: 'Model Kits', icon: '🚂' },
        { label: 'Collecting', icon: '🏺' },
        { label: 'Car', icon: '🚗' },
        { label: 'Movies', icon: '🎬' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Music', icon: '🎵' },
        { label: 'Puzzle Books', icon: '📖' },
        { label: 'BBQ', icon: '🍖' },
        { label: 'Tools', icon: '🔧' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Bird Watching', icon: '🦜' },
        { label: 'Beer', icon: '🍺' },
        { label: 'Whiskey', icon: '🥃' }
      ];
    case 'son':
      return [
        { label: 'Video Games', icon: '🎮' },
        { label: 'Building Sets', icon: '🧱' },
        { label: 'Sports', icon: '⚽' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Action Figures', icon: '🦸‍♂️' },
        { label: 'Remote Control', icon: '🚗' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Trading Cards', icon: '🃏' },
        { label: 'STEM Kits', icon: '🔬' },
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Books', icon: '📚' },
        { label: 'Music', icon: '🎵' },
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'Football', icon: '🏈' },
        { label: 'Basketball', icon: '🏀' },
        { label: 'Tech Gadgets', icon: '📱' },
        { label: 'Collectibles', icon: '🏺' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Gaming Merch', icon: '👕' },
        { label: 'Room Décor', icon: '🛋️' }
      ];
    case 'daughter':
      return [
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Dolls', icon: '👧' },
        { label: 'Fashion', icon: '👗' },
        { label: 'Makeup', icon: '💄' },
        { label: 'Skincare', icon: '🧴' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Books', icon: '📚' },
        { label: 'Journaling', icon: '📔' },
        { label: 'Music', icon: '🎵' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Dance', icon: '💃' },
        { label: 'Cats', icon: '🐱' },
        { label: 'Dogs', icon: '🐕' },
        { label: 'Photography', icon: '📸' },
        { label: 'Nail Art', icon: '💅' },
        { label: 'Puzzles', icon: '🧩' },
        { label: 'Room Décor', icon: '🛋️' },
        { label: 'Collecting', icon: '🏺' },
        { label: 'Video Games', icon: '🎮' },
        { label: 'Painting', icon: '🖌️' }
      ];
    case 'boyfriend':
      return [
        { label: 'Sports', icon: '⚽' },
        { label: 'Video Games', icon: '🎮' },
        { label: 'Tech Gadgets', icon: '📱' },
        { label: 'Cars', icon: '🚗' },
        { label: 'Motorcycles', icon: '🏍️' },
        { label: 'Fitness', icon: '💪' },
        { label: 'Collectibles', icon: '🏺' },
        { label: 'Music', icon: '🎵' },
        { label: 'Outdoor', icon: '🏕️' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Beer', icon: '🍺' },
        { label: 'Movies', icon: '🎬' },
        { label: 'TV', icon: '📺' },
        { label: 'Drone', icon: '🚁' },
        { label: 'Smart Home', icon: '🏠' },
        { label: 'Cooking', icon: '👨‍🍳' },
        { label: 'BBQ', icon: '🍖' },
        { label: 'Tools', icon: '🔧' },
        { label: 'Travel', icon: '✈️' },
        { label: 'Photography', icon: '📸' }
      ];
    case 'girlfriend':
      return [
        { label: 'Fashion', icon: '👗' },
        { label: 'Makeup', icon: '💄' },
        { label: 'Skincare', icon: '🧴' },
        { label: 'Jewelry', icon: '💍' },
        { label: 'Bath & Body', icon: '🛁' },
        { label: 'Music', icon: '🎵' },
        { label: 'Spa & Wellness', icon: '💆‍♀️' },
        { label: 'Arts & Crafts', icon: '🎨' },
        { label: 'Journaling', icon: '📔' },
        { label: 'Nail Art', icon: '💅' },
        { label: 'Cat', icon: '🐱' },
        { label: 'Dog', icon: '🐕' },
        { label: 'Photography', icon: '📸' },
        { label: 'Home Décor', icon: '🏠' },
        { label: 'Books', icon: '📚' },
        { label: 'Coffee', icon: '☕' },
        { label: 'Tea', icon: '🫖' },
        { label: 'Fitness', icon: '🏃‍♀️' },
        { label: 'Yoga', icon: '🧘‍♀️' },
        { label: 'Baking', icon: '🍪' },
        { label: 'Cooking', icon: '👩‍🍳' },
        { label: 'Board Games', icon: '🎲' },
        { label: 'Dance', icon: '💃' },
        { label: 'Outdoor', icon: '🏕️' }
      ];
    default:
      return [];
  }
};