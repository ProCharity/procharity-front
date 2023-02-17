/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  Container,
  CssBaseline,
  DeprecatedThemeOptions,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
  adaptV4Theme,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { themeLight, themeDark } from '../App.theme';
import useLocalStorage from './useLocalStorage';

const useThemeOptions = (themeColor: boolean) => {
  const theme = themeColor ? themeDark : themeLight;
  return useMemo(
    () =>
      createTheme(
        adaptV4Theme({
          palette: {
            ...theme.palette,
          },
          overrides: {
            MuiBadge: {
              colorSecondary: {
                backgroundColor: '#4caf50',
              },
            },
            MuiFormHelperText: {
              root: {
                position: 'absolute',
                bottom: '-19px',
                whiteSpace: 'nowrap',
                margin: 0,
                textAlign: 'left',
              },
              contained: {
                marginLeft: '0',
                marginRight: 0,
              },
            },
            MuiOutlinedInput: {
              input: {
                '&:-webkit-autofill': {
                  transitionDelay: '9999s',
                  '-webkit-text-fill-color': themeColor ? '#fff' : 'black',
                },
              },
              notchedOutline: {
                borderColor: themeColor ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.2)',
              },
            },
            MuiButton: {
              root: {
                cursor: 'pointer',
                width: '120px',
                minHeight: '44px',
                backgroundPosition: 'center',
                border: 'none',
                padding: '0',
                '&:hover': {
                  backgroundColor: !themeColor ? '#303f9f' : '#8852E1',
                },
              },
            },
            MuiIconButton: {
              root: {
                '&.Mui-disabled': {
                  filter: 'contrast(0)',
                },
              },
              disabled: {},
            },
            MuiSvgIcon: {
              root: {
                fill: themeColor ? 'white' : 'black',
              },
            },
            MuiTextField: {
              root: {
                '&:hover': {
                  borderColor: '#8852E1',
                },
              },
            },
            MuiLink: {
              root: {
                filter: themeColor ? 'brightness(1.5)' : 'brightness(1.0)',
              },
            },
            MuiContainer: {
              root: {
                width: '100%',
                maxWidth: '100%',
                paddingLeft: 0,
                paddingRight: 0,
                marginLeft: 0,
                marginRight: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '@media (min-width: 600px)': {
                  paddingLeft: 0,
                  paddingRight: 0,
                },
              },
              maxWidthLg: {
                width: '100%',
                maxWidth: '100%',
                '@media (min-width: 1280px)': {
                  width: '100%',
                  maxWidth: '100%',
                },
              },
            },
            MuiCssBaseline: {
              '@global': {
                body: {
                  overflow: 'auto',
                  backgroundColor: themeColor ? '#06091F' : '#f9f9f9',
                },
              },
            },
          },
        }),
      ),
    [theme.palette, themeColor],
  );
};

export default useThemeOptions;
