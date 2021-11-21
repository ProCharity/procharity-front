import {
  Container,
  CssBaseline,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
  adaptV4Theme,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import React, {useState, Context } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import AuthForm, {  } from './pages/AuthForm/AuthForm';
import Header from './components/Header/Header';
import Dashboard, { UserData, UsersTableData } from './pages/Dashboard/Dashboard';
import RegisterForm from './pages/RegisterForm/RegisterForm';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import { themeLight, themeDark } from './App.theme';
import RichTextEditor from './pages/RichTextEditor/RichTextEditor';
import Invite from './pages/Invite/Invite';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Users from './pages/Users/Users';
import ResetForm  from './pages/ResetForm/ResetForm';
import useThemeColor from './hooks/useThemeColor';
import useLocalStorage from './hooks/useLocalStorage';


interface IAuthContext {
  userToken: string | boolean;
  refreshToken: string | boolean;
  setUserToken: (value: string | boolean | ((val: string | boolean) => string | boolean)) => void;
  setRefreshToken: (value: string | boolean | ((val: string | boolean) => string | boolean)) => void;
  removeToken: () => void;
}
export const AuthContext: Context<IAuthContext> = React.createContext({
  userToken: false,
  refreshToken: false,
} as IAuthContext);


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


interface StatusI<Data> {
  status: string;
  statusMessage: null | string;
  isStatusLabelOpen: boolean;
  data: Data | null;
}

export interface HealthCheck {
  db: {
    status: boolean;
    db_connection_error: string;
    active_tasks: number;
    last_update: string;
  };
  bot: {
    status: boolean;
    error: string;
  };
}
const devLocation = process.env.NODE_ENV === 'development' || window.location.origin === 'http://178.154.202.217';

export const apiUrl = devLocation ? process.env.REACT_APP_API_DEV_ADDRESS : process.env.REACT_APP_API_ADDRESS;

function App() {
   const [userToken, setUserToken] = useLocalStorage<string | boolean>('user', false);
   const [refreshToken, setRefreshToken] = useLocalStorage<string | boolean>('refresh_token', false);
    const removeToken = () => {
      setUserToken(false);
      setRefreshToken(false);
    };
  const [status, setStatus] = useState<StatusI<UserData | UsersTableData>>({
    status: 'idle',
    statusMessage: null,
    isStatusLabelOpen: false,
    data: null,
  });

  const handleCloseError = () => setStatus({ ...status, statusMessage: null, isStatusLabelOpen: false });

  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setMenuOpen(true);
  };

  const handleDrawerClose = () => {
    setMenuOpen(false);
  };

const { themeColor, handleSetTheme} = useThemeColor();

  const theme = themeColor ? themeDark : themeLight;

  const themeOptions = React.useMemo(
    () =>
      createTheme(adaptV4Theme({
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
      })),
    [theme.palette, themeColor],
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themeOptions}>
        <CssBaseline />
        <AuthContext.Provider value={{
          userToken,
          setUserToken,
          refreshToken,
          setRefreshToken,
          removeToken
        }}>
          <Container>
            <Header
              isMenuOpen={isMenuOpen}
              isDark={themeColor}
              handleSetTheme={handleSetTheme}
              handleDrawerOpen={handleDrawerOpen}
              handleDrawerClose={handleDrawerClose}
              handleCloseError={handleCloseError}
            />

            <Switch>
              <Route exact path="/">
                {!userToken ? <AuthForm  /> : <Redirect exact from="/" to="/dashboard" />}
              </Route>

              <ProtectedRoute
                condition={userToken}
                component={<Dashboard isMenuOpen={isMenuOpen} />}
                path="/dashboard"
              />
              <ProtectedRoute
                condition={userToken}
                component={<RichTextEditor isMenuOpen={isMenuOpen} />}
                path="/send"
              />
              <ProtectedRoute
                condition={userToken}
                component={<Users isMenuOpen={isMenuOpen} />}
                path="/users"
              />
              <ProtectedRoute
                condition={userToken}
                component={<Invite isMenuOpen={isMenuOpen} />}
                path="/invite"
              />
              <Route path="/register/:id">
                <RegisterForm/>
              </Route>
              <Route path="/password_reset_confirm/:id">
                <ResetForm  />
              </Route>
              <Route path="/reset_password">
                <ResetPassword />
              </Route>
              <Redirect to="/" />
            </Switch>
          </Container>
        </AuthContext.Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
