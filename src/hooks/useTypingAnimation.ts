import { useState, useEffect } from 'react';

const TYPING_SPEED = 50;
const DELETING_SPEED = 30;
const PAUSE_DURATION = 3000;

const examples = [
  'Tech-savvy dad who loves cooking',
  'Grandma who loves cats budget about $40',
  'Annoying little brother, 8 years who likes gaming and picking his nose',
  'Gift for my handsome boyfriend <3 gym, food, 25 yrs. Budget around USD 100',
  'Something for my cat. She loves fish',
  'Looking for the perfect gift for my mum. Likes plants and baking. $50'
];

export const useTypingAnimation = () => {
  const [text, setText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const animateText = () => {
      const currentExample = examples[currentIndex];
      
      if (!isDeleting) {
        if (text.length < currentExample.length) {
          // Still typing
          setText(currentExample.slice(0, text.length + 1));
          timeout = setTimeout(animateText, TYPING_SPEED);
        } else {
          // Finished typing, pause before deleting
          timeout = setTimeout(() => {
            setIsDeleting(true);
            animateText();
          }, PAUSE_DURATION);
        }
      } else {
        if (text.length > 0) {
          // Still deleting
          setText(text.slice(0, -1));
          timeout = setTimeout(animateText, DELETING_SPEED);
        } else {
          // Finished deleting, move to next example
          setIsDeleting(false);
          setCurrentIndex((current) => (current + 1) % examples.length);
          timeout = setTimeout(animateText, TYPING_SPEED);
        }
      }
    };

    timeout = setTimeout(animateText, TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [text, currentIndex, isDeleting]);

  return text;
};