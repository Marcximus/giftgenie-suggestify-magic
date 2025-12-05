import { useState, useEffect, useCallback } from 'react';
import { searchExamples } from './searchExamples';

const TYPING_SPEED = 50;
const ERASING_SPEED = 30;
const PAUSE_DURATION = 3000;

export const TypingPlaceholder = () => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const getRandomExample = useCallback(() => {
    const newIndex = Math.floor(Math.random() * searchExamples.length);
    setCurrentExampleIndex(newIndex);
    return searchExamples[newIndex];
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const currentExample = searchExamples[currentExampleIndex];
    
    if (isTyping) {
      if (text.length < currentExample.length) {
        timeout = setTimeout(() => {
          setText(currentExample.slice(0, text.length + 1));
        }, TYPING_SPEED);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_DURATION);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(text.slice(0, -1));
        }, ERASING_SPEED);
      } else {
        getRandomExample();
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isTyping, currentExampleIndex, getRandomExample]);

  return text;
};