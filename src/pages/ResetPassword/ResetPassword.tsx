/* eslint-disable no-console */
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, TextField, Link, CircularProgress } from '@mui/material';
import * as yup from 'yup';
import ky, { Options } from 'ky';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import useStyles from '../AuthForm/AuthForm.styles';
import StatusLabel from '../../components/StatusLabel/StatusLabel';
import { useAsync } from '../../hooks/useAsync';
import { apiUrl } from '../../App';

interface IResetPasswordProps {
  children?: React.ReactNode;
}

const schema = yup.object().shape({
  email: yup.string().email('Такой e-mail не подойдет').required('Поле e-mail необходимо к заполнению'),
});

export interface IResetPasswordFormValues extends Options {
  email: string;
}
const ResetPassword: React.FC<IResetPasswordProps> = () => {
  const classes = useStyles();
  const { error, run, isError, setError, setData, isLoading, data } = useAsync({
    data: null,
    error: null,
  });

  const onResetPassword = async (dataReset: IResetPasswordFormValues) => {
    try {
      const response = await ky.post(`${apiUrl}/auth/password_reset`, {
        redirect: 'follow',
        json: {
          ...dataReset,
        },
        throwHttpErrors: false,
      });

      if (response.status === 200) {
        const result = await response.json();
        return result;
      }
      return Promise.reject(new Error(`Server responded with status ${response.status}`));
    } catch (e: any) {
      return Promise.reject(e);
    }
  };
   const statusMessage = isError ? (error as string) : ((data?.message ?? '') as string);
  const isStatusLabelOpen = Boolean(error) || Boolean(data?.message);
  const handleResetLabel = () => {
    if (isError) {
      setError(null);
      return;
    }
    setData(null);
  };
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Pick<IResetPasswordFormValues, 'email'>>({ resolver: yupResolver(schema), mode: 'onTouched' });
  const submitData = async (userData: IResetPasswordFormValues) => {
    run(onResetPassword(userData));
  };
  return (
    <>
      <StatusLabel
        isStatusLabelOpen={isStatusLabelOpen}
        statusMessage={statusMessage}
        isError={isError}
        handleCloseError={handleResetLabel}
      />
      <form className={classes.authForm} onSubmit={handleSubmit(submitData)}>
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
        </fieldset>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Link component={RouterLink} to="/">
              Вернуться на главную
            </Link>
            <Button className={classes.authFormButton} type="submit">
              Отправить
            </Button>
          </>
        )}
      </form>
    </>
  );
};

export default ResetPassword;
