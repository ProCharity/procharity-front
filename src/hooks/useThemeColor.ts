/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import * as React from 'react';
import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

const useThemeColor = () => {
     const [themeColor, setThemeColor] = useLocalStorage<boolean>('theme', true);
     const handleSetTheme = () => {
       setThemeColor(!themeColor);
     };

     useEffect(() => {
       const handleSetThemeLocal = () => {
         setThemeColor(themeColor);
       };
       if (localStorage.getItem('theme') === null) {
         handleSetThemeLocal();
       }
     }, [setThemeColor, themeColor]);

     return {
         themeColor,
         handleSetTheme,
     }
}

export default useThemeColor;