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
  'Looking for the perfect gift for my mum. Likes plants and baking. $50',
  'Something for a wife, 48 that says "Sorry I forgot our anniversary"',
  'Gift for coworker who talks during meetings, budget 5 USD',
  'Aunt 54 who loves knitting and talking non-stop ($40)',
  'I have no idea, just give me some ideas PLEASE',
  'Funny gift for my lazy teenage nephew, 16 (about $70)'
];

export const useTypingAnimation = () => {
  const [text, setText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(
    Math.floor(Math.random() * examples.length)
  );
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
          // Finished deleting, move to next random example
          setIsDeleting(false);
          let nextIndex;
          do {
            nextIndex = Math.floor(Math.random() * examples.length);
          } while (nextIndex === currentIndex); // Ensure we don't repeat the same example
          setCurrentIndex(nextIndex);
          timeout = setTimeout(animateText, TYPING_SPEED);
        }
      }
    };

    timeout = setTimeout(animateText, TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [text, currentIndex, isDeleting]);

  return text;
};