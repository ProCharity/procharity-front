import React, { useState, useContext } from 'react';
import * as yup from 'yup';
import ky from 'ky';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { TextField, Button, Link, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useStyles from './AuthForm.styles';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import { apiUrl, AuthContext } from '../../App';

const schema = yup.object().shape({
  email: yup.string().email('Такой e-mail не подойдет').required('Поле e-mail необходимо к заполнению'),
  password: yup.string().required('Поле пароль необходимо к заполнению').min(8, 'Минимальная длина пароля 8 символов'),
});

export interface ILoginFormValues {
  email: string;
  password: string;
}

const AuthForm: React.FC = () => {
const history = useHistory()
  const {setUserToken, setRefreshToken, } = useContext(AuthContext)
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Pick<ILoginFormValues, 'email' | 'password'>>({ resolver: yupResolver(schema), mode: 'onTouched' });
  const onLogin = async (data: ILoginFormValues) => {
    try {
      const response = await ky.post(`${apiUrl}/auth/login`, {
        body: new URLSearchParams({username: data.email, password: data.password}),
        throwHttpErrors: false,
        redirect: 'follow',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      const response_data = await response.json();

      if (response.status === 200) {
        const token: { access_token: string; refresh_token: string } = response_data;
        setUserToken(token.access_token);
        setRefreshToken(token.refresh_token);
        history.push('/dashboard');
        return Promise.resolve();
      }
      if (response.status === 400 && response_data.detail == "LOGIN_BAD_CREDENTIALS") {
        return Promise.reject(new Error("Пользователь не найден, либо был введен не верный пароль."));
      }
      return Promise.reject(new Error(`Server responded with status ${response.status}`));
    } catch (e: any) {
      return Promise.reject(e);
    }
  };

  const classes = useStyles();
  const { error, run, isError, setError, setData, isLoading } = useAsync({
    data: null,
    error: null,
  });

  const handleResetLabel = () => {
    if (isError) {
      setError(null);
      return;
    }
    setData(null);
  };
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const handleClickShowPassword = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  const onSubmit = async (userData: ILoginFormValues) => {
    run(onLogin(userData));
  };

  return <>
    <StatusLabel
      isStatusLabelOpen={error}
      statusMessage={error}
      isError={isError}
      handleCloseError={handleResetLabel}
    />
    <form className={classes.authForm} onSubmit={handleSubmit(onSubmit)}>
      <fieldset className={classes.authFormInputContainer}>
        <Controller
          name="email"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              label="E-mail"
              error={Boolean(errors.email?.message)}
              helperText={errors.email?.message}
              className={classes.authFormInput}
              size="medium"
              variant="outlined"
              {...field}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              variant="outlined"
              label="Пароль"
              error={Boolean(errors.password?.message)}
              helperText={errors.password?.message}
              className={classes.authFormInput}
              type={isPasswordVisible ? 'text' : 'password'}
              size="medium"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      size="large">
                      {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...field}
            />
          )}
        />
      </fieldset>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Link component={RouterLink} to="/reset_password">
            Забыли пароль?
          </Link>
          <Button className={classes.authFormButton} type="submit">
            Войти
          </Button>
        </>
      )}
    </form>
  </>;
};

export default AuthForm;
