import { Container, CssBaseline, ThemeProvider, Theme, StyledEngineProvider } from '@mui/material';

import React, { useState, Context } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import AuthForm from './pages/AuthForm/AuthForm';
import Header from './components/Header/Header';
import Dashboard, { IUserData, IUsersTableData } from './pages/Dashboard/Dashboard';
import RegisterForm from './pages/RegisterForm/RegisterForm';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import RichTextEditor from './pages/RichTextEditor/RichTextEditor';
import Invite from './pages/Invite/Invite';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Users from './pages/Users/Users';
import ResetForm from './pages/ResetForm/ResetForm';
import useThemeColor from './hooks/useThemeColor';
import useLocalStorage from './hooks/useLocalStorage';
import useThemeOptions from './hooks/useThemeOptions';

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
export const apiUrl = `${
  process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : window.location.origin
}/api/v1`;

function App() {
  const [userToken, setUserToken] = useLocalStorage<string | boolean>('user', false);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | boolean>('refresh_token', false);
  const removeToken = () => {
    setUserToken(false);
    setRefreshToken(false);
  };
  const [status, setStatus] = useState<StatusI<IUserData | IUsersTableData>>({
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

  const { themeColor, handleSetTheme } = useThemeColor();
  const themeOptions = useThemeOptions(themeColor);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themeOptions}>
        <CssBaseline />
        <AuthContext.Provider
          value={{
            userToken,
            setUserToken,
            refreshToken,
            setRefreshToken,
            removeToken,
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
                {!userToken ? <AuthForm /> : <Redirect exact from="/" to="/dashboard" />}
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
              <ProtectedRoute condition={userToken} component={<Users isMenuOpen={isMenuOpen} />} path="/users" />
              <ProtectedRoute condition={userToken} component={<Invite isMenuOpen={isMenuOpen} />} path="/invite" />
              <Route path="/register/:id">
                <RegisterForm />
              </Route>
              <Route path="/password_reset_confirm/:id">
                <ResetForm />
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
